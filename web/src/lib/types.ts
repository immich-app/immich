import type { QueueResponseDto } from '@immich/sdk';
import type { MenuItem } from '@immich/ui';
import type { HTMLAttributes } from 'svelte/elements';

export type ActionItem = MenuItem & {
  disabled?: boolean;
  props?: Omit<HTMLAttributes<HTMLElement>, 'color'>;
};

export type DataRecord = [number, number];

export type QueueSnapshot = { timestamp: number; snapshot?: QueueResponseDto[] };
