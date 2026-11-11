import type { TimelineAsset } from '#lib/managers/timeline-manager/types.ts';
import { BaseEventManager } from '#lib/utils/base-event-manager.svelte.ts';
import type { TreeNode } from '#lib/utils/tree-utils.ts';
import type {
  AlbumResponseDto,
  AlbumUserRole,
  ApiKeyResponseDto,
  AssetResponseDto,
  IntegrityReport,
  JobCreateDto,
  LoginResponseDto,
  PasskeyResponseDto,
  PersonResponseDto,
  QueueResponseDto,
  ReleaseEventV1,
  StackResponseDto,
  AdminConfigDto,
  TagResponseDto,
  UserAdminResponseDto,
} from '@immich/sdk';

export type Events = {
  AppInit: [];
  AppNavigate: [];

  AuthLogin: [LoginResponseDto];
  AuthLogout: [];
  AuthUserLoaded: [UserAdminResponseDto];

  LanguageChange: [{ name: string; code: string; rtl?: boolean }];

  ApiKeyCreate: [ApiKeyResponseDto];
  ApiKeyUpdate: [ApiKeyResponseDto];
  ApiKeyDelete: [ApiKeyResponseDto];

  PasskeyCreate: [PasskeyResponseDto];
  PasskeyUpdate: [PasskeyResponseDto];
  PasskeyDelete: [PasskeyResponseDto];

  AssetUpdate: [AssetResponseDto];
  AssetsArchive: [string[]];
  AssetsUnarchive: [TimelineAsset[]];
  AssetsUndoArchive: [TimelineAsset[]];
  AssetsDelete: [string[]];
  AssetEditsApplied: [string];
  AssetsTag: [string[]];

  AlbumAddAssets: [{ assetIds: string[]; albumIds: string[] }];
  AlbumRemoveAssets: [{ assetIds: string[]; albumIds: string[] }];
  AlbumCreate: [AlbumResponseDto];
  AlbumUpdate: [AlbumResponseDto];
  AlbumDelete: [AlbumResponseDto];
  AlbumShare: [];
  AlbumUserUpdate: [{ albumId: string; userId: string; role: AlbumUserRole }];
  AlbumUserDelete: [{ albumId: string; userId: string }];

  PersonUpdate: [PersonResponseDto];
  PersonShare: [{ personId: string }];
  PersonUserDelete: [{ personId: string; userId: string }];
  PersonThumbnailReady: [{ id: string }];
  PersonAssetDelete: [{ id: string; assetId: string }];

  BackupDeleteStatus: [{ filename: string; isDeleting: boolean }];
  BackupDeleted: [{ filename: string }];
  BackupUpload: [{ progress: number; isComplete: boolean }];

  QueueUpdate: [QueueResponseDto];

  StackCreate: [StackResponseDto];
  /** Unstacked, with assets to handle */
  StackDelete: [{ id: string; assets: AssetResponseDto[] }];
  /** Contains the new stack. If any assets are removed, AssetUpdate events are emitted for each. */
  StackUpdate: [StackResponseDto];

  TagCreate: [TagResponseDto];
  TagUpdate: [TagResponseDto];
  TagDelete: [TreeNode];

  UserPinCodeReset: [];

  UserAdminDeleted: [{ id: string }];

  SessionLocked: [];
  SessionDelete: [];

  SystemConfigUpdate: [AdminConfigDto];

  IntegrityReportDeleteStatus: [{ type?: IntegrityReport; id?: string; isDeleting: boolean }];
  IntegrityReportDeleted: [{ type?: IntegrityReport; id?: string }];

  JobCreate: [{ dto: JobCreateDto }];

  ReleaseEvent: [ReleaseEventV1];

  WebsocketConnect: [];
};

export const eventManager = new BaseEventManager<Events>();
