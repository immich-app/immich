import { correlationIdHeader, resourceUpdateBatchDelay } from '#lib/constants.ts';
import { queryClient } from '#lib/queries/client.ts';
import type { QueryKey } from '@tanstack/svelte-query';
import type { Socket } from 'socket.io-client';

type ResourceEvent = { changed: string[]; deleted: string[]; correlationId?: string };
type DeleteListener = { path: string[]; onDelete: () => void };

class ResourceManager {
  #clientId = crypto.randomUUID().split('-', 1)[0];
  #requestCount = 0;
  #pendingPaths = new Set<string>();
  #flushTimer?: ReturnType<typeof setTimeout>;
  #wasDisconnected = false;
  #deleteListeners = new Set<DeleteListener>();

  withCorrelationId(impl: typeof fetch): typeof fetch {
    return (input, init) => {
      const headers = new Headers(init?.headers);
      headers.set(correlationIdHeader, `${this.#clientId}.${++this.#requestCount}`);
      return impl(input, { ...init, headers });
    };
  }

  handleEvent({ changed, deleted, correlationId }: ResourceEvent) {
    if (this.#isFromThisTab(correlationId)) {
      return;
    }

    const deletedPaths = deleted.map((path) => toSegments(path));
    const isDeleted = (path: string[]) => deletedPaths.some((deletedPath) => isAtOrBelow(path, deletedPath));

    for (const path of this.#pendingPaths) {
      if (isDeleted(toSegments(path))) {
        this.#pendingPaths.delete(path);
      }
    }

    for (const { path, onDelete } of this.#deleteListeners) {
      if (isDeleted(path)) {
        onDelete();
      }
    }

    queryClient.removeQueries({ predicate: ({ queryKey }) => isDeleted(getResourcePath(queryKey)) });
    void queryClient.invalidateQueries({
      predicate: ({ queryKey }) => {
        const resourcePath = getResourcePath(queryKey);
        return deletedPaths.some((deletedPath) => isAtOrBelow(deletedPath, resourcePath));
      },
    });

    for (const path of changed) {
      this.#pendingPaths.add(path);
    }

    if (this.#flushTimer) {
      return;
    }

    this.#flushTimer = setTimeout(() => this.#flush(), resourceUpdateBatchDelay);
  }

  onDelete(path: string, onDelete: () => void) {
    const listener = { path: toSegments(path), onDelete };
    this.#deleteListeners.add(listener);
    return () => void this.#deleteListeners.delete(listener);
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

  #isFromThisTab(correlationId?: string) {
    return correlationId?.startsWith(`${this.#clientId}.`) ?? false;
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

const isAtOrBelow = (path: string[], ancestor: string[]) =>
  ancestor.length > 0 && path.length >= ancestor.length && ancestor.every((segment, index) => segment === path[index]);

const isSameBranch = (a: string[], b: string[]) => isAtOrBelow(a, b) || isAtOrBelow(b, a);

export const onResourceDelete = (getPath: () => string | undefined, onDelete: () => void) => {
  $effect(() => {
    const path = getPath();
    if (path) {
      return resourceManager.onDelete(path, onDelete);
    }
  });
};
