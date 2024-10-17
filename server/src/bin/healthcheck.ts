#!/usr/bin/env node
import { ImmichWorker } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';

const main = async () => {
  const { workers, port } = new ConfigRepository().getEnv();
  if (!workers.includes(ImmichWorker.API)) {
    process.exit();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    const response = await fetch(`http://localhost:${port}/api/server/ping`, {
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
