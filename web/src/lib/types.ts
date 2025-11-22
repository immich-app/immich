import type { ServerVersionResponseDto } from '@immich/sdk';
import type { MenuItem } from '@immich/ui';
import type { HTMLAttributes } from 'svelte/elements';

export type ActionItem = MenuItem & { props?: Omit<HTMLAttributes<HTMLElement>, 'color'> };

export interface ReleaseEvent {
  isAvailable: boolean;
  /** ISO8601 */
  checkedAt: string;
  serverVersion: ServerVersionResponseDto;
  releaseVersion: ServerVersionResponseDto;
}
