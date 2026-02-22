import type { ThemeSetting } from '$lib/managers/theme-manager.svelte';
import type { ReleaseEvent } from '$lib/types';
import { BaseEventManager } from '$lib/utils/base-event-manager.svelte';
import type { TreeNode } from '$lib/utils/tree-utils';
import type {
  AlbumResponseDto,
  AlbumUserRole,
  ApiKeyResponseDto,
  AssetResponseDto,
  LibraryResponseDto,
  LoginResponseDto,
  PersonResponseDto,
  QueueResponseDto,
  SharedLinkResponseDto,
  SystemConfigDto,
  TagResponseDto,
  UserAdminResponseDto,
  WorkflowResponseDto,
} from '@immich/sdk';

export type Events = {
  AppInit: [];

  AuthLogin: [LoginResponseDto];
  AuthLogout: [];
  AuthUserLoaded: [UserAdminResponseDto];

  LanguageChange: [{ name: string; code: string; rtl?: boolean }];
  ThemeChange: [ThemeSetting];

  ApiKeyCreate: [ApiKeyResponseDto];
  ApiKeyUpdate: [ApiKeyResponseDto];
  ApiKeyDelete: [ApiKeyResponseDto];

  AssetUpdate: [AssetResponseDto];
  AssetsArchive: [string[]];
  AssetsDelete: [string[]];
  AssetEditsApplied: [string];
  AssetsTag: [string[]];

  AlbumAddAssets: [{ assetIds: string[]; albumIds: string[] }];
  AlbumUpdate: [AlbumResponseDto];
  AlbumDelete: [AlbumResponseDto];
  AlbumShare: [];
  AlbumUserUpdate: [{ albumId: string; userId: string; role: AlbumUserRole }];
  AlbumUserDelete: [{ albumId: string; userId: string }];

  PersonUpdate: [PersonResponseDto];
  PersonThumbnailReady: [{ id: string }];
  PersonAssetDelete: [{ id: string; assetId: string }];

  BackupDeleteStatus: [{ filename: string; isDeleting: boolean }];
  BackupDeleted: [{ filename: string }];
  BackupUpload: [{ progress: number; isComplete: boolean }];

  QueueUpdate: [QueueResponseDto];

  SharedLinkCreate: [SharedLinkResponseDto];
  SharedLinkUpdate: [SharedLinkResponseDto];
  SharedLinkDelete: [SharedLinkResponseDto];

  TagCreate: [TagResponseDto];
  TagUpdate: [TagResponseDto];
  TagDelete: [TreeNode];

  UserPinCodeReset: [];

  UserAdminCreate: [UserAdminResponseDto];
  UserAdminUpdate: [UserAdminResponseDto];
  UserAdminRestore: [UserAdminResponseDto];
  // soft deleted
  UserAdminDelete: [UserAdminResponseDto];
  // confirmed permanently deleted from server
  UserAdminDeleted: [{ id: string }];

  SessionLocked: [];

  SystemConfigUpdate: [SystemConfigDto];

  LibraryCreate: [LibraryResponseDto];
  LibraryUpdate: [LibraryResponseDto];
  LibraryDelete: [{ id: string }];

  WorkflowCreate: [WorkflowResponseDto];
  WorkflowUpdate: [WorkflowResponseDto];
  WorkflowDelete: [WorkflowResponseDto];

  ReleaseEvent: [ReleaseEvent];
};

export const eventManager = new BaseEventManager<Events>();
