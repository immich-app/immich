#!/usr/bin/env node

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function waitForUrl(
  url,
  {
    fetchImpl = fetch,
    intervalMs = 2_000,
    sleep = defaultSleep,
    timeoutMs = 120_000,
  } = {},
) {
  const startedAt = Date.now();
  let attempts = 0;
  let lastFailure = "no attempts made";

  do {
    attempts += 1;

    try {
      const response = await fetchImpl(url);
      if (response.ok) {
        return { attempts };
      }

      lastFailure = `HTTP ${response.status}`;
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : String(error);
    }

    if (Date.now() - startedAt >= timeoutMs) {
      break;
    }

    await sleep(intervalMs);
  } while (true);

  throw new Error(
    `Timed out waiting for ${url} after ${attempts} attempts. Last failure: ${lastFailure}`,
  );
}

async function main() {
  const [url] = process.argv.slice(2);
  if (!url) {
    console.error("Usage: wait-for-url.mjs <url>");
    process.exitCode = 2;
    return;
  }

  const timeoutMs = Number(process.env.WAIT_FOR_URL_TIMEOUT_MS ?? 120_000);
  const intervalMs = Number(process.env.WAIT_FOR_URL_INTERVAL_MS ?? 2_000);

  try {
    const { attempts } = await waitForUrl(url, { intervalMs, timeoutMs });
    console.log(`Reached ${url} after ${attempts} attempt(s)`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
