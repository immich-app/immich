import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { waitForUrl } from "./wait-for-url.mjs";

describe("waitForUrl", () => {
  it("retries until the URL returns a successful response", async () => {
    let attempts = 0;

    const result = await waitForUrl("http://127.0.0.1:2285/api/server/ping", {
      fetchImpl: async () => ({
        ok: ++attempts === 3,
        status: attempts === 3 ? 200 : 503,
      }),
      intervalMs: 1,
      sleep: async () => {},
      timeoutMs: 100,
    });

    assert.equal(result.attempts, 3);
  });

  it("throws with the last failure when the timeout expires", async () => {
    await assert.rejects(
      waitForUrl("http://127.0.0.1:2285/api/server/ping", {
        fetchImpl: async () => {
          throw new Error("connect ECONNREFUSED 127.0.0.1:2285");
        },
        intervalMs: 1,
        sleep: async () => {},
        timeoutMs: 0,
      }),
      /Timed out waiting for http:\/\/127\.0\.0\.1:2285\/api\/server\/ping.*ECONNREFUSED/s,
    );
  });
});
