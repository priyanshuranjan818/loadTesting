import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

const dbClient = new DynamoDBClient({});
const sfnClient = new SFNClient({});
const RESULTS_TABLE = process.env.RESULTS_TABLE;
const STATE_MACHINE_ARN = process.env.STATE_MACHINE_ARN;

// NOTE: Step Functions' arn:aws:states:::lambda:invoke integration is region-local —
// it cannot invoke Lambdas in other regions. We use only the us-east-1 worker here.
// Lambda scales horizontally within the region so high concurrency still works.
const WORKER_ARN = process.env.WORKER_ARN_US;
const TARGET_REGIONS = ['us-east-1', 'ap-south-1', 'eu-west-1'];

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { url, totalRequests, concurrency } = body;
    
    if (!url || !totalRequests || !concurrency) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing parameters" }) };
    }
    
    const testId = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const createdAt = Date.now();
    
    // Save metadata
    await dbClient.send(new PutItemCommand({
      TableName: RESULTS_TABLE,
      Item: {
        testId: { S: testId },
        requestId: { S: "META" },
        url: { S: url },
        totalRequests: { N: totalRequests.toString() },
        concurrency: { N: concurrency.toString() },
        status: { S: "RUNNING" },
        createdAt: { N: createdAt.toString() }
      }
    }));
    
    // Create worker configs — each worker gets a regional Lambda ARN
    // so Step Functions routes it to the correct region.
    const workers = [];
    const baseRequestsPerWorker = Math.floor(totalRequests / concurrency);
    let remainingRequests = totalRequests % concurrency;
    
    for (let i = 0; i < concurrency; i++) {
        let reqCount = baseRequestsPerWorker + (remainingRequests > 0 ? 1 : 0);
        if (remainingRequests > 0) remainingRequests--;
        if (reqCount > 0) {
            const lambdaArn = WORKER_ARN;
            const targetRegion = TARGET_REGIONS[i % TARGET_REGIONS.length];
            workers.push({ testId, url, requestCount: reqCount, workerId: `w${i}`, lambdaArn, targetRegion });
        }
    }
    
    // Start step function
    await sfnClient.send(new StartExecutionCommand({
      stateMachineArn: STATE_MACHINE_ARN,
      input: JSON.stringify({ workers })
    }));
    
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true"
      },
      body: JSON.stringify({ testId })
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
