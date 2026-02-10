import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import type { QueueResponseDto, ServerVersionResponseDto } from '@immich/sdk';
import type { ActionItem } from '@immich/ui';

export interface ReleaseEvent {
  isAvailable: boolean;
  /** ISO8601 */
  checkedAt: string;
  serverVersion: ServerVersionResponseDto;
  releaseVersion: ServerVersionResponseDto;
}

export type QueueSnapshot = { timestamp: number; snapshot?: QueueResponseDto[] };

export type HeaderButtonActionItem = ActionItem & { data?: { title?: string } };

export enum UploadState {
  PENDING,
  STARTED,
  DONE,
  ERROR,
  DUPLICATED,
}

export type UploadAsset = {
  id: string;
  file: File;
  assetId?: string;
  isTrashed?: boolean;
  albumId?: string;
  progress?: number;
  state?: UploadState;
  startDate?: number;
  eta?: number;
  speed?: number;
  error?: unknown;
  message?: string;
};

export enum OnboardingRole {
  SERVER = 'server',
  USER = 'user',
}

export type AssetControlContext = {
  // Wrap assets in a function, because context isn't reactive.
  getAssets: () => TimelineAsset[]; // All assets includes partners' assets
  getOwnedAssets: () => TimelineAsset[]; // Only assets owned by the user
  clearSelect: () => void;
};
