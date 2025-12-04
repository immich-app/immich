import { eventManager } from '$lib/managers/event-manager.svelte';
import type { QueueSnapshot } from '$lib/types';
import { getQueues, type QueueResponseDto } from '@immich/sdk';
import { DateTime } from 'luxon';

export class QueueManager {
  #snapshots = $state<QueueSnapshot[]>([]);
  #queues: QueueResponseDto[] = $derived(this.#snapshots.at(-1)?.snapshot ?? []);

  #interval?: ReturnType<typeof setInterval>;
  #listenerCount = 0;

  get snapshots() {
    return this.#snapshots;
  }

  get queues() {
    return this.#queues;
  }

  constructor() {
    eventManager.on('QueueUpdate', () => void this.refresh());
  }

  listen() {
    if (!this.#interval) {
      this.#interval = setInterval(() => void this.refresh(true), 3000);
    }

    this.#listenerCount++;
    void this.refresh();

    return () => this.#listenerCount--;
  }

  async refresh(tick = false) {
    this.#snapshots.push({
      timestamp: DateTime.now().toMillis(),
      snapshot: this.#listenerCount > 0 || !tick ? await getQueues().catch(() => undefined) : undefined,
    });
    this.#snapshots = this.#snapshots.slice(-30);
  }
}

export const queueManager = new QueueManager();
