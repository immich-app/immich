import type { QueueResponseDto, ServerVersionResponseDto } from '@immich/sdk';

export interface ReleaseEvent {
  isAvailable: boolean;
  /** ISO8601 */
  checkedAt: string;
  serverVersion: ServerVersionResponseDto;
  releaseVersion: ServerVersionResponseDto;
}

export type QueueSnapshot = { timestamp: number; snapshot?: QueueResponseDto[] };
