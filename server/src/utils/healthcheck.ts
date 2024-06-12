#!/usr/bin/env node
const port = Number(process.env.IMMICH_PORT) || 3001;
const controller = new AbortController();

const main = async () => {
  if (!process.env.IMMICH_WORKERS_INCLUDE?.includes('api')) {
    process.exit();
  }

  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    const response = await fetch(`http://localhost:${port}/api/server-info/ping`, {
      signal: controller.signal,
    });

    if (response.ok) {
      const body = await response.json();
      if (body.res === 'pong') {
        process.exit();
      }
    }
  } catch (error) {
    if (error instanceof DOMException === false) {
      console.error(error);
    }
  } finally {
    clearTimeout(timeout);
  }

  process.exit(1);
};

void main();
