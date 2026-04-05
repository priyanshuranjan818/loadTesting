import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});
const RESULTS_TABLE = process.env.RESULTS_TABLE;

function percentile(sortedLatencies, p) {
  if (sortedLatencies.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sortedLatencies.length) - 1;
  return sortedLatencies[Math.max(0, idx)];
}

export const handler = async (event) => {
  try {
    const testId = event.pathParameters?.testId;
    
    if (!testId) {
      return { statusCode: 400, body: JSON.stringify({ error: "No testId provided" }) };
    }
    
    let allItems = [];
    let lastEvaluatedKey = undefined;
    
    do {
      const resp = await client.send(new QueryCommand({
        TableName: RESULTS_TABLE,
        KeyConditionExpression: "testId = :tid",
        ExpressionAttributeValues: {
          ":tid": { S: testId }
        },
        ExclusiveStartKey: lastEvaluatedKey
      }));
      allItems = allItems.concat(resp.Items);
      lastEvaluatedKey = resp.LastEvaluatedKey;
    } while (lastEvaluatedKey);
    
    const metaRecord = allItems.find(item => item.requestId.S === "META");
    const testRecords = allItems.filter(item => item.requestId.S !== "META");
    
    const latencies = testRecords.map(item => parseInt(item.latency?.N || "0")).sort((a,b) => a - b);
    
    const p50 = percentile(latencies, 50);
    const p95 = percentile(latencies, 95);
    const p99 = percentile(latencies, 99);
    
    const errors = testRecords.filter(item => {
        const s = parseInt(item.status?.N || "0");
        return s >= 400 || s === 0;
    }).length;
    
    const regions = {};
    testRecords.forEach(item => {
      const reg = item.region?.S || "unknown";
      if (!regions[reg]) { regions[reg] = { count: 0, latencies: [] }; }
      regions[reg].count += 1;
      regions[reg].latencies.push(parseInt(item.latency?.N || "0"));
    });
    
    const targetUrl = metaRecord ? metaRecord.url?.S : "unknown";
    const totalRequestsWanted = metaRecord ? parseInt(metaRecord.totalRequests?.N || "0") : 0;
    const completedRequests = testRecords.length;
    let isComplete = false;
    if (completedRequests >= totalRequestsWanted && totalRequestsWanted > 0) {
        isComplete = true; // simplifying completion logic
    }
    
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true
      },
      body: JSON.stringify({
        testId,
        url: targetUrl,
        wanted: totalRequestsWanted,
        completed: completedRequests,
        isComplete,
        p50,
        p95,
        p99,
        errors,
        regions
      })
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
