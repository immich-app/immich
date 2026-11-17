import { correlationIdHeader, resourceUpdateBatchDelay } from '#lib/constants.ts';
import { queryClient } from '#lib/queries/client.ts';
import type { QueryKey } from '@tanstack/svelte-query';
import type { Socket } from 'socket.io-client';

type ResourceUpdate = { paths: string[]; correlationId: string };

class ResourceManager {
  #clientId = crypto.randomUUID().split('-', 1)[0];
  #requestCount = 0;
  #pendingPaths = new Set<string>();
  #flushTimer?: ReturnType<typeof setTimeout>;
  #wasDisconnected = false;

  withCorrelationId(impl: typeof fetch): typeof fetch {
    return (input, init) => {
      const headers = new Headers(init?.headers);
      headers.set(correlationIdHeader, `${this.#clientId}.${++this.#requestCount}`);
      return impl(input, { ...init, headers });
    };
  }

  handleUpdate({ paths, correlationId }: ResourceUpdate) {
    if (correlationId.startsWith(`${this.#clientId}.`)) {
      return;
    }

    for (const path of paths) {
      this.#pendingPaths.add(path);
    }

    if (this.#flushTimer) {
      return;
    }

    this.#flushTimer = setTimeout(() => this.#flush(), resourceUpdateBatchDelay);
  }

  handleConnect() {
    if (!this.#wasDisconnected) {
      return;
    }

    this.#wasDisconnected = false;
    void queryClient.invalidateQueries();
  }

  handleDisconnect(reason: Socket.DisconnectReason) {
    this.#wasDisconnected = reason !== 'io client disconnect';
  }

  #flush() {
    const changedPaths = [...this.#pendingPaths].map((path) => toSegments(path));
    this.#pendingPaths.clear();
    this.#flushTimer = undefined;

    void queryClient.invalidateQueries({
      predicate: ({ queryKey }) => {
        const resourcePath = getResourcePath(queryKey);
        return changedPaths.some((changedPath) => isSameBranch(resourcePath, changedPath));
      },
    });
  }
}

export const resourceManager = new ResourceManager();

const toSegments = (path: string) => path.split('/').filter(Boolean);

const getResourcePath = (queryKey: QueryKey) => {
  const end = queryKey.findIndex((part) => typeof part !== 'string');
  return queryKey.slice(0, end === -1 ? undefined : end) as string[];
};

const isSameBranch = (a: string[], b: string[]) => {
  const length = Math.min(a.length, b.length);
  return length > 0 && a.slice(0, length).every((segment, index) => segment === b[index]);
};
