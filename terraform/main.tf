# terraform/main.tf
# Provisions all infrastructure for the Haxx load tester.
# Workers are deployed in 3 AWS regions for true parallel multi-region load testing.

# ─── Providers ────────────────────────────────────────────────────────────────

provider "aws" {
  region = "us-east-1"
}

provider "aws" {
  alias  = "ap_south_1"
  region = "ap-south-1"
}

provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"
}

# ─── DynamoDB (central — us-east-1 only) ─────────────────────────────────────

resource "aws_dynamodb_table" "results_table" {
  name           = "load-test-results"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "testId"
  range_key      = "requestId"

  attribute {
    name = "testId"
    type = "S"
  }

  attribute {
    name = "requestId"
    type = "S"
  }
}

# ─── IAM Role for Lambda (global — reused across all regions) ─────────────────

resource "aws_iam_role" "lambda_exec" {
  name = "load-tester-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "lambda-dynamodb-sfn"
  role = aws_iam_role.lambda_exec.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:Query",
          "states:StartExecution",
          "lambda:InvokeFunction"
        ]
        Resource = "*"
      }
    ]
  })
}

# ─── Worker Lambda — us-east-1 ────────────────────────────────────────────────

data "archive_file" "worker_zip" {
  type        = "zip"
  source_dir  = "../backend/functions/worker"
  output_path = "worker.zip"
  excludes    = ["node_modules"]
}

resource "aws_lambda_function" "worker_us" {
  filename         = "worker.zip"
  function_name    = "load-tester-worker"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.worker_zip.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 60
  environment {
    variables = {
      RESULTS_TABLE  = aws_dynamodb_table.results_table.name
      DYNAMODB_REGION = "us-east-1"
    }
  }
}

# ─── Worker Lambda — ap-south-1 ───────────────────────────────────────────────

resource "aws_lambda_function" "worker_ap" {
  provider         = aws.ap_south_1
  filename         = "worker.zip"
  function_name    = "load-tester-worker"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.worker_zip.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 60
  environment {
    variables = {
      RESULTS_TABLE   = aws_dynamodb_table.results_table.name
      # Force cross-region writes back to the central us-east-1 DynamoDB table
      DYNAMODB_REGION = "us-east-1"
    }
  }
}

# ─── Worker Lambda — eu-west-1 ────────────────────────────────────────────────

resource "aws_lambda_function" "worker_eu" {
  provider         = aws.eu_west_1
  filename         = "worker.zip"
  function_name    = "load-tester-worker"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.worker_zip.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 60
  environment {
    variables = {
      RESULTS_TABLE   = aws_dynamodb_table.results_table.name
      DYNAMODB_REGION = "us-east-1"
    }
  }
}

# ─── Step Functions Role ──────────────────────────────────────────────────────

resource "aws_iam_role" "sfn_exec" {
  name = "load-tester-sfn-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "states.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "sfn_lambda_invoke" {
  name = "sfn-invoke-lambda"
  role = aws_iam_role.sfn_exec.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow",
        Action = ["lambda:InvokeFunction"],
        # Allow invoking workers in all 3 regions
        Resource = [
          aws_lambda_function.worker_us.arn,
          aws_lambda_function.worker_ap.arn,
          aws_lambda_function.worker_eu.arn,
        ]
      }
    ]
  })
}

# ─── Step Functions State Machine ─────────────────────────────────────────────
# definition.json uses "FunctionName.$": "$.lambdaArn" — no template substitution needed.

resource "aws_sfn_state_machine" "sfn_state_machine" {
  name       = "load-tester-state-machine"
  role_arn   = aws_iam_role.sfn_exec.arn
  definition = file("../backend/statemachine/definition.json")
}

# ─── startTest Lambda ─────────────────────────────────────────────────────────

data "archive_file" "startTest_zip" {
  type        = "zip"
  source_dir  = "../backend/functions/startTest"
  output_path = "startTest.zip"
  excludes    = ["node_modules"]
}

resource "aws_lambda_function" "startTest" {
  filename         = "startTest.zip"
  function_name    = "load-tester-startTest"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.startTest_zip.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 15
  environment {
    variables = {
      RESULTS_TABLE     = aws_dynamodb_table.results_table.name
      STATE_MACHINE_ARN = aws_sfn_state_machine.sfn_state_machine.arn
      # Regional worker ARNs — startTest distributes workers round-robin
      WORKER_ARN_US     = aws_lambda_function.worker_us.arn
      WORKER_ARN_AP     = aws_lambda_function.worker_ap.arn
      WORKER_ARN_EU     = aws_lambda_function.worker_eu.arn
    }
  }
}

# ─── getResults Lambda ────────────────────────────────────────────────────────

data "archive_file" "getResults_zip" {
  type        = "zip"
  source_dir  = "../backend/functions/getResults"
  output_path = "getResults.zip"
  excludes    = ["node_modules"]
}

resource "aws_lambda_function" "getResults" {
  filename         = "getResults.zip"
  function_name    = "load-tester-getResults"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.getResults_zip.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 15
  environment {
    variables = {
      RESULTS_TABLE = aws_dynamodb_table.results_table.name
    }
  }
}

# ─── API Gateway HTTP API (v2) ────────────────────────────────────────────────

resource "aws_apigatewayv2_api" "http_api" {
  name          = "load-tester-http-api"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["content-type"]
  }
}

resource "aws_apigatewayv2_integration" "startTest_integration" {
  api_id             = aws_apigatewayv2_api.http_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.startTest.invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "startTest_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /start-test"
  target    = "integrations/${aws_apigatewayv2_integration.startTest_integration.id}"
}

resource "aws_apigatewayv2_integration" "getResults_integration" {
  api_id             = aws_apigatewayv2_api.http_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.getResults.invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "getResults_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /results/{testId}"
  target    = "integrations/${aws_apigatewayv2_integration.getResults_integration.id}"
}

resource "aws_apigatewayv2_stage" "default_stage" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "apigw_startTest" {
  statement_id  = "AllowExecutionFromAPIGatewayStart"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.startTest.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_getResults" {
  statement_id  = "AllowExecutionFromAPIGatewayGet"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.getResults.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# ─── Outputs ──────────────────────────────────────────────────────────────────

output "api_endpoint" {
  description = "Paste this as VITE_API_URL in frontend/.env"
  value       = aws_apigatewayv2_api.http_api.api_endpoint
}

output "worker_arn_us_east_1" {
  value = aws_lambda_function.worker_us.arn
}

output "worker_arn_ap_south_1" {
  value = aws_lambda_function.worker_ap.arn
}

output "worker_arn_eu_west_1" {
  value = aws_lambda_function.worker_eu.arn
}
