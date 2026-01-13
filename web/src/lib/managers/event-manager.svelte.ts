import type { ThemeSetting } from '$lib/managers/theme-manager.svelte';
import type { ReleaseEvent } from '$lib/types';
import type { TreeNode } from '$lib/utils/tree-utils';
import type {
  AlbumResponseDto,
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
  AssetReplace: [{ oldAssetId: string; newAssetId: string }];
  AssetsArchive: [string[]];
  AssetsDelete: [string[]];

  AlbumAddAssets: [];
  AlbumUpdate: [AlbumResponseDto];
  AlbumDelete: [AlbumResponseDto];
  AlbumShare: [];

  PersonUpdate: [PersonResponseDto];

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

  SystemConfigUpdate: [SystemConfigDto];

  LibraryCreate: [LibraryResponseDto];
  LibraryUpdate: [LibraryResponseDto];
  LibraryDelete: [{ id: string }];

  WorkflowUpdate: [WorkflowResponseDto];
  WorkflowDelete: [WorkflowResponseDto];

  ReleaseEvent: [ReleaseEvent];
};

type Listener<EventMap extends Record<string, unknown[]>, K extends keyof EventMap> = (...params: EventMap[K]) => void;

class EventManager<EventMap extends Record<string, unknown[]>> {
  private listeners: {
    [K in keyof EventMap]?: {
      listener: Listener<EventMap, K>;
      once?: boolean;
    }[];
  } = {};

  on<T extends keyof EventMap>(key: T, listener: (...params: EventMap[T]) => void) {
    return this.addListener(key, listener, false);
  }

  once<T extends keyof EventMap>(key: T, listener: (...params: EventMap[T]) => void) {
    return this.addListener(key, listener, true);
  }

  off<K extends keyof EventMap>(key: K, listener: Listener<EventMap, K>) {
    if (this.listeners[key]) {
      this.listeners[key] = this.listeners[key].filter((item) => item.listener !== listener);
    }

    return this;
  }

  emit<T extends keyof EventMap>(key: T, ...params: EventMap[T]) {
    if (!this.listeners[key]) {
      return;
    }

    for (const { listener } of this.listeners[key]) {
      listener(...params);
    }

    // remove one time listeners
    this.listeners[key] = this.listeners[key].filter((item) => !item.once);
  }

  private addListener<T extends keyof EventMap>(key: T, listener: (...params: EventMap[T]) => void, once: boolean) {
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }

    this.listeners[key].push({ listener, once });

    return this;
  }
}

export const eventManager = new EventManager<Events>();
