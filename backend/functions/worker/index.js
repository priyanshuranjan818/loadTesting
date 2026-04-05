import { DynamoDBClient, BatchWriteItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});
const RESULTS_TABLE = process.env.RESULTS_TABLE;

export const handler = async (event) => {
  const { testId, url, requestCount, workerId } = event;
  
  if (!testId || !url || !requestCount) {
    throw new Error("Missing parameters");
  }

  const results = [];
  
  // Fire all requests asynchronously
  const requests = Array.from({ length: requestCount }, async (_, idx) => {
    const requestId = `${Date.now()}-${workerId}-${idx}-${Math.random().toString(36).substring(7)}`;
    const start = Date.now();
    let status = 0;
    let errorMsg = "";
    
    try {
      const response = await fetch(url);
      status = response.status;
    } catch (error) {
      status = 500;
      errorMsg = error.message;
    }
    
    const latency = Date.now() - start;
    
    return {
      PutRequest: {
        Item: {
          testId: { S: testId },
          requestId: { S: requestId },
          latency: { N: latency.toString() },
          status: { N: status.toString() },
          error: { S: errorMsg },
          region: { S: process.env.AWS_REGION || "local" },
          timestamp: { N: start.toString() }
        }
      }
    };
  });

  const resolvedResults = await Promise.all(requests);
  
  // Batch write to DynamoDB (25 items limit per batch)
  for (let i = 0; i < resolvedResults.length; i += 25) {
    const batch = resolvedResults.slice(i, i + 25);
    const params = {
      RequestItems: {
        [RESULTS_TABLE]: batch
      }
    };
    
    try {
      await client.send(new BatchWriteItemCommand(params));
    } catch (err) {
      console.error("BatchWriteItem Error", err);
    }
  }

  return { success: true, count: resolvedResults.length };
};
