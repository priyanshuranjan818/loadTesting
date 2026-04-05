# terraform/main.tf
provider "aws" {
  region = "us-east-1"
}

# DynamoDB
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

# IAM Role for Lambda
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

# Worker Lambda
data "archive_file" "worker_zip" {
  type        = "zip"
  source_dir  = "../backend/functions/worker"
  output_path = "worker.zip"
}
resource "aws_lambda_function" "worker" {
  filename         = "worker.zip"
  function_name    = "load-tester-worker"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.worker_zip.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 60
  environment {
    variables = {
      RESULTS_TABLE = aws_dynamodb_table.results_table.name
    }
  }
}

# Step Functions Role
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
        Resource = aws_lambda_function.worker.arn
      }
    ]
  })
}

# Step Function Definition
data "template_file" "sfn_definition" {
  template = file("../backend/statemachine/definition.json")
  vars = {
    worker_arn = "${aws_lambda_function.worker.arn}"
  }
}

resource "aws_sfn_state_machine" "sfn_state_machine" {
  name     = "load-tester-state-machine"
  role_arn = aws_iam_role.sfn_exec.arn
  definition = data.template_file.sfn_definition.rendered
}

# StartTest Lambda
data "archive_file" "startTest_zip" {
  type        = "zip"
  source_dir  = "../backend/functions/startTest"
  output_path = "startTest.zip"
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
      RESULTS_TABLE = aws_dynamodb_table.results_table.name
      STATE_MACHINE_ARN = aws_sfn_state_machine.sfn_state_machine.arn
    }
  }
}

# GetResults Lambda
data "archive_file" "getResults_zip" {
  type        = "zip"
  source_dir  = "../backend/functions/getResults"
  output_path = "getResults.zip"
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

# API Gateway skeleton
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
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.startTest.invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "startTest_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /start-test"
  target    = "integrations/${aws_apigatewayv2_integration.startTest_integration.id}"
}

resource "aws_apigatewayv2_integration" "getResults_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.getResults.invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "getResults_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /results/{testId}"
  target    = "integrations/${aws_apigatewayv2_integration.getResults_integration.id}"
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

output "api_endpoint" {
  value = aws_apigatewayv2_api.http_api.api_endpoint
}
