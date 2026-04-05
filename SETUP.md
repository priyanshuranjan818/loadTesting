# 🚀 Haxx Load Tester — Setup Guide

> **Who is this for?** Complete beginners. You don't need to know AWS or Terraform deeply — just follow these steps in order and you'll have a real, live load testing tool deployed on the cloud.

---

## What you'll set up

By the end of this guide, you'll have:

- ✅ A React frontend hosted on a live URL (CloudFront CDN)
- ✅ Three Lambda functions running in the cloud
- ✅ A DynamoDB database storing test results
- ✅ Workers firing in **3 AWS regions simultaneously** (US, India, Europe)
- ✅ A live dashboard showing p50/p95/p99 latency

**Estimated time:** 45–60 minutes

---

## Prerequisites — Install these first

You need 4 tools before anything else. Install them in this order:

### 1. Node.js (v20 or newer)
Go to https://nodejs.org and download the **LTS** version. Run the installer.

Check it worked:
```bash
node --version
# should print something like: v20.x.x
```

### 2. AWS CLI
The AWS CLI lets you talk to Amazon Web Services from your terminal.

- **Windows:** Download the installer from https://aws.amazon.com/cli/ → click "64-bit Windows installer"
- **Mac:** Run `brew install awscli` (if you have Homebrew) or download from the link above

Check it worked:
```bash
aws --version
# should print: aws-cli/2.x.x ...
```

### 3. Terraform
Terraform is the tool that creates all your cloud infrastructure automatically.

- **Windows:** Download the zip from https://developer.hashicorp.com/terraform/downloads → extract `terraform.exe` → move it to `C:\Windows\System32\`
- **Mac:** Run `brew tap hashicorp/tap && brew install hashicorp/tap/terraform`

Check it worked:
```bash
terraform --version
# should print: Terraform v1.x.x
```

### 4. An AWS Account (Free Tier)
If you don't have one, go to https://aws.amazon.com and click **"Create a Free Account"**.

You'll need:
- A valid email address
- A credit card (won't be charged — AWS free tier covers everything we use)
- A phone number for SMS verification

---

## Step 1 — Connect your terminal to AWS

This is the most important step. You're giving Terraform permission to create resources in your AWS account.

### 1a — Find your AWS Access Keys

1. Go to https://console.aws.amazon.com
2. Click your name in the **top-right corner**
3. Click **"Security credentials"**
4. Scroll down to **"Access keys"** and click **"Create access key"**
5. Choose **"Command Line Interface (CLI)"** → check the confirmation box → click **"Next"**
6. Click **"Create access key"**
7. **⚠️ IMPORTANT:** Copy both the **Access key ID** and **Secret access key** now. You cannot see the secret key again after closing this page.

### 1b — Configure the AWS CLI

Run this in your terminal:
```bash
aws configure
```

It will ask you 4 questions. Answer them like this:

```
AWS Access Key ID [None]: PASTE_YOUR_ACCESS_KEY_ID_HERE
AWS Secret Access Key [None]: PASTE_YOUR_SECRET_ACCESS_KEY_HERE
Default region name [None]: us-east-1
Default output format [None]: json
```

### 1c — Verify it works
```bash
aws sts get-caller-identity
```

You should see something like:
```json
{
    "UserId": "AIDAXXXXXXXXXXXXXXXXX",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/your-username"
}
```

If you see that — great! AWS is connected. If you get an error, double-check your access key and secret.

---

## Step 2 — Clone / Open the Project

If you haven't already, open the `loadTesting` folder in your terminal:

```bash
# Navigate to the project folder (adjust path if needed)
cd ~/Desktop/loadTesting

# Confirm you're in the right place
ls
# You should see: backend/  frontend/  terraform/  CLAUDE.md  SETUP.md
```

---

## Step 3 — Install Backend Dependencies

Each Lambda function needs its own npm packages.

```bash
# Worker function
cd backend/functions/worker
npm install

# startTest function
cd ../startTest
npm install

# getResults function
cd ../getResults
npm install

# Go back to project root
cd ../../..
```

---

## Step 4 — Deploy Everything with Terraform

This single command creates your entire cloud infrastructure — DynamoDB, 3 Lambda functions (in 3 regions!), Step Functions, API Gateway, IAM roles. Everything.

```bash
# Move into the terraform folder
cd terraform

# Step 4a: Download required Terraform plugins (only needed once)
terraform init
```

You should see:
```
Terraform has been successfully initialized!
```

```bash
# Step 4b: Preview what Terraform will create (does NOT create anything yet)
terraform plan
```

This shows you a list of everything it's about to create. Look for lines like:
```
+ aws_lambda_function.worker_us will be created
+ aws_lambda_function.worker_ap will be created
+ aws_lambda_function.worker_eu will be created
+ aws_dynamodb_table.results_table will be created
...
```

If it looks good, continue:

```bash
# Step 4c: Actually create all the infrastructure
terraform apply
```

Terraform will ask:
```
Do you want to perform these actions? Enter a value:
```

Type `yes` and press Enter.

⏳ This takes about **2–5 minutes**. You'll see resources being created one by one.

When it's done, you'll see something like:
```
Apply complete! Resources: 22 added, 0 changed, 0 destroyed.

Outputs:

api_endpoint = "https://abc123xyz.execute-api.us-east-1.amazonaws.com"
worker_arn_ap_south_1 = "arn:aws:lambda:ap-south-1:..."
worker_arn_eu_west_1 = "arn:aws:lambda:eu-west-1:..."
worker_arn_us_east_1 = "arn:aws:lambda:us-east-1:..."
```

🎉 **Copy the `api_endpoint` value — you'll need it in the next step.**

---

## Step 5 — Configure the Frontend

Now you need to tell the React app where your API lives.

```bash
# Go into the frontend folder
cd ../frontend

# Copy the example environment file
copy .env.example .env       # Windows
# OR on Mac/Linux:
cp .env.example .env
```

Open the newly created `frontend/.env` file in any text editor (Notepad, VS Code, etc.) and replace the placeholder URL with your actual `api_endpoint` from Step 4:

```bash
# frontend/.env
VITE_API_URL=https://abc123xyz.execute-api.us-east-1.amazonaws.com
```

> ⚠️ **No trailing slash** at the end of the URL. Don't add `/` at the end.

---

## Step 6 — Test Locally First

Before deploying the frontend, let's make sure everything works on your computer.

```bash
# Still in the frontend/ folder
npm install
npm run dev
```

Open your browser and go to: **http://localhost:5173**

You should see the Haxx dashboard. Try it out:

1. The URL field should be pre-filled with `https://httpbin.org/get` — this is a free public test endpoint that's safe to hammer
2. Set **Total Requests** to `20`
3. Set **Concurrency** to `5`
4. Click **"Initialize Attack"**

The dashboard should expand and within a few seconds you'll see **p50/p95/p99** latency cards populate with real data.

If it works — your entire system is live! 🎉

---

## Step 7 — Deploy Frontend to the Cloud (Optional)

Right now the frontend only runs when your computer is on (`npm run dev`). To get a public URL anyone can visit, deploy it to AWS S3 + CloudFront.

### 7a — Build the production bundle
```bash
# In the frontend/ folder
npm run build
```

This creates a `dist/` folder with optimized files.

### 7b — Create an S3 bucket
```bash
# Replace YOUR_NAME with something unique (e.g. haxx-johndoe-2024)
aws s3 mb s3://haxx-frontend-YOUR_NAME --region us-east-1
```

### 7c — Upload the build to S3
```bash
aws s3 sync dist/ s3://haxx-frontend-YOUR_NAME
```

### 7d — Create a CloudFront Distribution

The easiest way is through the AWS Console:

1. Go to https://console.aws.amazon.com/cloudfront
2. Click **"Create distribution"**
3. Under **"Origin domain"**, select your S3 bucket (`haxx-frontend-YOUR_NAME.s3.amazonaws.com`)
4. Under **"Default root object"**, type `index.html`
5. Click **"Create distribution"**
6. Wait ~5 minutes for it to deploy
7. Copy the **"Distribution domain name"** (looks like `d1abc2defg.cloudfront.net`)

That's your public URL! Share it with anyone. 🌍

---

## Troubleshooting

### ❌ `terraform apply` fails with "Access Denied"
Your IAM user doesn't have enough permissions. Either:
- Attach the `AdministratorAccess` policy to your user in the AWS Console, or
- Ask your AWS account owner to grant you permissions

### ❌ `terraform apply` fails with "InvalidClientTokenId"
Your access keys are wrong. Run `aws configure` again and paste the correct keys.

### ❌ Frontend shows "Error connecting to API"
- Double-check that `frontend/.env` has the correct `VITE_API_URL`
- Make sure there's no trailing slash after the URL
- Try running `terraform output api_endpoint` from the terraform folder to get the URL again

### ❌ Dashboard shows numbers but they're all 0 / test never completes
- Check the Lambda function logs in AWS Console → Lambda → `load-tester-worker` → Monitor → View logs in CloudWatch
- Make sure the target URL you're testing is publicly accessible (not `localhost`)

### ❌ `terraform destroy` — how to delete everything
When you're done and want to avoid any AWS charges:
```bash
cd terraform
terraform destroy
```
Type `yes` when prompted. This deletes everything Terraform created.

---

## How much does this cost?

**Practically $0** within AWS free tier limits.

| Service | Free Tier | What We Use | Cost |
|---|---|---|---|
| Lambda | 1M requests/month | ~1K per test | Free |
| DynamoDB | 25 GB storage | ~1 MB per test | Free |
| API Gateway | 1M requests/month | Negligible | Free |
| Step Functions | 4,000 state transitions/month | ~N per test | Free |
| S3 | 5 GB | ~2 MB (frontend) | Free |
| CloudFront | 1 TB transfer/month | Negligible | Free |

You'd have to run thousands of tests per day to exceed free tier.

---

## What happens when you run a test?

Here's the flow under the hood — good for understanding or explaining in an interview:

```
You click "Initialize Attack"
    │
    ▼
Your browser → POST /start-test → API Gateway → startTest Lambda
    │
    ├── Saves test metadata to DynamoDB
    ├── Distributes workers round-robin across 3 regions:
    │     w0, w3, w6 → us-east-1
    │     w1, w4, w7 → ap-south-1  (Mumbai)
    │     w2, w5, w8 → eu-west-1   (Ireland)
    │
    └── Starts Step Functions execution with worker configs
                │
                ▼
    Step Functions Map state (MaxConcurrency: 0)
    → Fires ALL workers simultaneously in parallel
    → Each worker fires its share of HTTP requests
    → Each writes results to DynamoDB
                │
                ▼
Your browser polls GET /results/:testId every 2 seconds
    → Reads DynamoDB
    → Calculates p50/p95/p99
    → Updates the live dashboard
```

---

## Next Steps (optional improvements)

Once you're comfortable, here are things you can add:

| Feature | Description |
|---|---|
| 🔒 Cognito Auth | Add login so only you can use the tool |
| 📡 WebSockets | Replace polling with real-time push updates |
| 📊 Test History | Store and compare results across multiple test runs |
| 📧 Slack Alerts | Send a Slack message when a test finishes |
| 📥 CSV Export | Download raw latency data as a spreadsheet |
| 🔁 POST support | Test POST endpoints with custom headers and body |
