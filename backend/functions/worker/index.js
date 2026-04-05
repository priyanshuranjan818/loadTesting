import { DynamoDBClient, BatchWriteItemCommand } from "@aws-sdk/client-dynamodb";

// DYNAMODB_REGION forces cross-region workers (ap-south-1, eu-west-1) to
// write results back to the central us-east-1 DynamoDB table.
const client = new DynamoDBClient({ region: process.env.DYNAMODB_REGION || undefined });
const RESULTS_TABLE = process.env.RESULTS_TABLE;

export const handler = async (event) => {
  const { testId, url, requestCount, workerId, targetRegion } = event;
  
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
    
    // Per-request timeout: abort after 25s so a sleeping/slow target URL
    // (e.g. Render cold-start) doesn't hang the entire Lambda until it
    // gets killed. We still write the result to DynamoDB so the count
    // advances correctly.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25_000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      status = response.status;
    } catch (error) {
      status = error.name === 'AbortError' ? 0 : 500;
      errorMsg = error.name === 'AbortError' ? 'Request timed out (25s)' : error.message;
    } finally {
      clearTimeout(timeoutId);
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
          region: { S: targetRegion || process.env.AWS_REGION || "local" },
          timestamp: { N: start.toString() }
        }
      }
    };
  });

  const resolvedResults = await Promise.all(requests);
  
  // Batch write to DynamoDB (25 items max per call).
  // DynamoDB can return UnprocessedItems under load — we must retry them,
  // otherwise those results are silently lost and the count gets stuck.
  const batchWriteWithRetry = async (items) => {
    let remaining = items;
    let delay = 100; // ms — exponential backoff starting point

    while (remaining.length > 0) {
      const batch = remaining.slice(0, 25);
      try {
        const resp = await client.send(new BatchWriteItemCommand({
          RequestItems: { [RESULTS_TABLE]: batch }
        }));
        // Any items DynamoDB couldn't process get returned here
        const unprocessed = resp.UnprocessedItems?.[RESULTS_TABLE] ?? [];
        // Remaining = unprocessed from this batch + anything after first 25
        remaining = [...unprocessed, ...remaining.slice(25)];
        if (unprocessed.length > 0) {
          await new Promise(r => setTimeout(r, delay));
          delay = Math.min(delay * 2, 2000); // cap at 2s
        } else {
          remaining = remaining.slice(25); // already advanced above, safe slice
          delay = 100; // reset on success
        }
      } catch (err) {
        console.error("BatchWriteItem error — retrying", err);
        await new Promise(r => setTimeout(r, delay));
        delay = Math.min(delay * 2, 2000);
      }
    }
  };

  // Kick off all batch writes concurrently (each call handles its own retries)
  const batches = [];
  for (let i = 0; i < resolvedResults.length; i += 25) {
    batches.push(batchWriteWithRetry(resolvedResults.slice(i, i + 25)));
  }
  await Promise.all(batches);

  return { success: true, count: resolvedResults.length };
};
