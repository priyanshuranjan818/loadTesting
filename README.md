# API Load Testing Tool — CLAUDE.md

## What is this project?

A distributed API load testing tool built entirely on AWS free tier.
You paste any API endpoint, set how many fake users to simulate and how fast,
and the tool fires real HTTP requests from multiple AWS regions simultaneously.
It then shows you a live dashboard with latency stats (p50, p95, p99),
error rate, and a breakdown of results by region.

Think of it as a free, self-hosted version of BlazeMeter or Loader.io —
built by you, deployed on your own AWS account, costs $0.

---

## Why this exists (the problem it solves)

Every backend API has a breaking point — a traffic level where it slows
down or crashes. The only way to find that breaking point safely is to
simulate it yourself before real users hit it.

Example: You build an e-commerce app. Big sale tomorrow. Without load testing,
you have no idea if your server survives 500 users at once. With this tool,
you fire 500 simulated requests tonight, see your p99 latency jump to 8s,
fix the bottleneck, and the sale goes fine.

---

## Real world use cases

- Test your API before a product launch
- Find the exact request count where your server starts failing
- Compare latency across AWS regions (is your API slower in Asia vs Europe?)
- Prove your infrastructure scales under load (great for interviews)
- Debug slow endpoints by isolating p95/p99 outliers

---

## Tech stack

| Layer          | Technology                        | Why                                      |
|----------------|-----------------------------------|------------------------------------------|
| Frontend       | React + Vite                      | Fast to build, easy to deploy            |
| Charts         | Recharts                          | Simple, composable charting library      |
| Hosting        | S3 + CloudFront                   | Free tier, global CDN, HTTPS out of box  |
| API layer      | API Gateway (REST)                | Managed, scales to zero, free tier       |
| Orchestration  | AWS Step Functions                | Parallel Map state fans out to N workers |
| Workers        | AWS Lambda (Node.js 20.x)         | Scales instantly, runs in any region     |
| Database       | DynamoDB (on-demand)              | Stores every request result, free tier   |
| Auth (optional)| AWS Cognito                       | Protects your tool from public misuse    |
| IaC            | Terraform                         | Provisions all infra in one command      |

---

## Architecture overview

```
User (React app)
    │
    │  POST /start-test { url, totalRequests, concurrency }
    ▼
API Gateway
    │
    │  triggers
    ▼
startTest Lambda
    │  creates testId, saves metadata to DynamoDB
    │  starts Step Functions execution
    ▼
Step Functions (Map state — MaxConcurrency: 0)
    │
    ├──▶ Lambda worker (us-east-1)  ──┐
    ├──▶ Lambda worker (ap-south-1) ──┼──▶ DynamoDB (writes every result)
    └──▶ Lambda worker (eu-west-1)  ──┘
                                          │
React frontend polls GET /results/:testId │
    ◀─────────────────────────────────────┘
    displays p50 / p95 / p99 / error rate live
```

The key insight: Step Functions `Map` state with `MaxConcurrency: 0` fires
ALL workers at the exact same millisecond. That's what makes this a real
load test and not just a sequential loop.

---

## Project folder structure

```
load-tester/
├── backend/
│   ├── functions/
│   │   ├── worker/
│   │   │   └── index.js          # fires HTTP requests, writes to DynamoDB
│   │   ├── startTest/
│   │   │   └── index.js          # receives config, starts Step Functions
│   │   └── getResults/
│   │       └── index.js          # queries DynamoDB, calculates p50/p95/p99
│   └── statemachine/
│       └── definition.json       # Step Functions state machine definition
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # main layout + polling logic
│   │   ├── TestForm.jsx          # URL input, concurrency, request count
│   │   └── ResultsDashboard.jsx  # stat cards + live latency chart
│   ├── index.html
│   └── vite.config.js
├── terraform/
│   └── main.tf                   # provisions ALL AWS infrastructure
├── .env.example
└── CLAUDE.md                     # this file
```

---

## DynamoDB schema

Table name: `load-test-results`
Partition key: `testId` (String)
Sort key: `requestId` (String)

### Record types

**Test metadata record** (one per test):
```json
{
  "testId":        "test-1712345678901",
  "requestId":     "META",
  "url":           "https://api.example.com/users",
  "totalRequests": 500,
  "concurrency":   50,
  "status":        "RUNNING",
  "createdAt":     1712345678901
}
```

**Request result record** (one per HTTP request fired):
```json
{
  "testId":    "test-1712345678901",
  "requestId": "1712345679123-4-0.8234",
  "latency":   142,
  "status":    200,
  "error":     "",
  "region":    "us-east-1",
  "timestamp": 1712345679123
}
```

---

## Step Functions state machine explained

```json
{
  "StartAt": "RunWorkers",
  "States": {
    "RunWorkers": {
      "Type": "Map",
      "ItemsPath": "$.workers",
      "MaxConcurrency": 0,
      "Iterator": { ... invokes worker Lambda ... },
      "End": true
    }
  }
}
```

- `Type: Map` — iterates over an array and runs each item through the iterator
- `ItemsPath: $.workers` — the array of worker configs passed in at execution start
- `MaxConcurrency: 0` — fire ALL workers simultaneously with no limit
- Each worker gets: `{ testId, url, requestCount, workerId }`

---

## How p50 / p95 / p99 is calculated

After collecting all latency values from DynamoDB, sort them ascending.
Then pick the value at the percentile index.

```js
function percentile(sortedLatencies, p) {
  const idx = Math.ceil((p / 100) * sortedLatencies.length) - 1;
  return sortedLatencies[Math.max(0, idx)];
}

// example: 1000 requests, sorted
percentile(latencies, 50)  // median — what most users experience
percentile(latencies, 95)  // 950 out of 1000 users were faster than this
percentile(latencies, 99)  // 990 out of 1000 users were faster than this
```

p99 is the most important number. If your p99 is 4000ms, 1 in 100 users
waits 4 full seconds. That's a real problem even if your average is 200ms.

---

## Step by step build guide

### Prerequisites
- AWS account (free tier)
- Node.js 20+ installed
- Terraform installed (`brew install terraform` or download from terraform.io)
- AWS CLI configured (`aws configure`)

---

### Day 1 — Backend

#### Step 1 — Create DynamoDB table
```bash
aws dynamodb create-table \
  --table-name load-test-results \
  --attribute-definitions \
    AttributeName=testId,AttributeType=S \
    AttributeName=requestId,AttributeType=S \
  --key-schema \
    AttributeName=testId,KeyType=HASH \
    AttributeName=requestId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

#### Step 2 — Write the worker Lambda
Create `backend/functions/worker/index.js` — fires HTTP requests and
batch writes results to DynamoDB. (Full code in previous message.)

Install dependency:
```bash
cd backend/functions/worker
npm init -y
npm install @aws-sdk/client-dynamodb
```

#### Step 3 — Deploy worker Lambda
```bash
zip -r worker.zip .
aws lambda create-function \
  --function-name load-tester-worker \
  --runtime nodejs20.x \
  --handler index.handler \
  --zip-file fileb://worker.zip \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --environment Variables="{RESULTS_TABLE=load-test-results}" \
  --timeout 60 \
  --region us-east-1
```

Repeat for `ap-south-1` and `eu-west-1` regions for multi-region workers.

#### Step 4 — Create Step Functions state machine
```bash
aws stepfunctions create-state-machine \
  --name load-tester-state-machine \
  --definition file://backend/statemachine/definition.json \
  --role-arn arn:aws:iam::YOUR_ACCOUNT_ID:role/stepfunctions-role \
  --region us-east-1
```

#### Step 5 — Deploy startTest and getResults Lambdas
Same process as Step 3. Set environment variables:
```
RESULTS_TABLE=load-test-results
STATE_MACHINE_ARN=arn:aws:states:us-east-1:YOUR_ACCOUNT_ID:stateMachine:load-tester-state-machine
```

#### Step 6 — Create API Gateway
```bash
# Create REST API
aws apigateway create-rest-api --name load-tester-api --region us-east-1

# Add routes:
# POST /start-test  → startTest Lambda
# GET  /results/{testId} → getResults Lambda

# Enable CORS on both routes
```

Test your backend:
```bash
curl -X POST https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/start-test \
  -H "Content-Type: application/json" \
  -d '{"url":"https://httpbin.org/get","totalRequests":10,"concurrency":2}'
```

You should get back: `{ "testId": "test-1712345678901" }`

---

### Day 2 — Frontend + Deploy

#### Step 7 — Create React app
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install recharts
```

Copy App.jsx code from the previous message into `src/App.jsx`.

Create `.env`:
```
VITE_API_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod
```

Test locally:
```bash
npm run dev
```

Open `http://localhost:5173`, paste `https://httpbin.org/get`, set 20 requests,
2 concurrency, click Run. You should see results populate.

#### Step 8 — Deploy frontend to S3 + CloudFront
```bash
# Build
npm run build

# Create S3 bucket
aws s3 mb s3://load-tester-frontend-YOUR_NAME --region us-east-1

# Upload build
aws s3 sync dist/ s3://load-tester-frontend-YOUR_NAME

# Create CloudFront distribution pointing to the S3 bucket
# (do this in AWS Console or via Terraform — see Step 9)
```

#### Step 9 — Use Terraform for everything (recommended)
Instead of the manual steps above, run everything with one command:
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

The `main.tf` provisions: DynamoDB, 3 Lambda functions, Step Functions,
API Gateway with CORS, S3 bucket, CloudFront distribution, all IAM roles.

---

### Verify everything works end to end

1. Open your CloudFront URL
2. Paste `https://httpbin.org/get` (a safe public test endpoint)
3. Set 50 total requests, 5 concurrency
4. Click Run Test
5. Watch p50/p95/p99 cards populate in real time
6. See the latency chart update every 2 seconds
7. See results broken down by region at the bottom

---

## Environment variables reference

| Variable            | Where         | Value                                         |
|---------------------|---------------|-----------------------------------------------|
| RESULTS_TABLE       | All Lambdas   | `load-test-results`                           |
| STATE_MACHINE_ARN   | startTest     | ARN of your Step Functions state machine      |
| VITE_API_URL        | React (.env)  | Your API Gateway base URL                     |

---

## IAM permissions needed

**Lambda execution role** needs:
```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:PutItem",
    "dynamodb:BatchWriteItem",
    "dynamodb:Query",
    "states:StartExecution",
    "lambda:InvokeFunction"
  ],
  "Resource": "*"
}
```

**Step Functions role** needs:
```json
{
  "Effect": "Allow",
  "Action": ["lambda:InvokeFunction"],
  "Resource": "arn:aws:lambda:*:*:function:load-tester-worker"
}
```

---

## Free tier usage estimate

| Service         | Free tier limit          | This project uses        |
|-----------------|--------------------------|--------------------------|
| Lambda          | 1M requests/month        | ~10K per test run        |
| DynamoDB        | 25GB storage             | ~1MB per 1000 requests   |
| API Gateway     | 1M calls/month           | Negligible               |
| Step Functions  | 4000 state transitions   | ~N workers per execution |
| S3              | 5GB storage              | ~5MB (React build)       |
| CloudFront      | 1TB transfer/month       | Negligible               |

You can run hundreds of tests per month and stay completely on free tier.

---

## What to say in your interview

> "I built a distributed load testing tool on AWS. The React frontend is
> hosted on CloudFront and S3. When you run a test, API Gateway triggers
> a Lambda that starts a Step Functions execution. The state machine uses
> a Map state with MaxConcurrency zero to fan out parallel Lambda workers
> across three AWS regions simultaneously. Each worker fires its share of
> HTTP requests and writes latency and status data to DynamoDB. The React
> frontend polls every two seconds and calculates p50, p95, and p99 latency
> in real time. The whole thing runs on AWS free tier."

Key terms you can speak to confidently:
- Distributed systems (multi-region Lambda)
- Event-driven architecture (Step Functions Map state)
- Percentile latency (p50/p95/p99 and why p99 matters)
- Serverless (Lambda scales to zero, no servers to manage)
- IaC (Terraform provisions everything reproducibly)

---

## Potential extensions (add these to stand out even more)

- WebSocket API instead of polling for truly real-time results
- Cognito auth so only you can use the tool
- Historical test comparison (run test twice, compare results side by side)
- Slack notification when a test completes
- CSV export of raw results
- Support for POST requests with custom headers and body
- Auto-scaling detection (run at 100, 200, 500, 1000 and graph where it breaks)
#   l o a d T e s t i n g  
 