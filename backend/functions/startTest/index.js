import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

const dbClient = new DynamoDBClient({});
const sfnClient = new SFNClient({});
const RESULTS_TABLE = process.env.RESULTS_TABLE;
const STATE_MACHINE_ARN = process.env.STATE_MACHINE_ARN;

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
    
    // Create worker configs
    const workers = [];
    const baseRequestsPerWorker = Math.floor(totalRequests / concurrency);
    let remainingRequests = totalRequests % concurrency;
    
    for (let i = 0; i < concurrency; i++) {
        let reqCount = baseRequestsPerWorker + (remainingRequests > 0 ? 1 : 0);
        if (remainingRequests > 0) remainingRequests--;
        if (reqCount > 0) {
            workers.push({ testId, url, requestCount: reqCount, workerId: `w${i}` });
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
        "Access-Control-Allow-Credentials": true
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
