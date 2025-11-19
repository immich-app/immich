import type { ThemeSetting } from '$lib/managers/theme-manager.svelte';
import type {
  AlbumResponseDto,
  LibraryResponseDto,
  LoginResponseDto,
  SharedLinkResponseDto,
  SystemConfigDto,
  UserAdminResponseDto,
} from '@immich/sdk';

export type Events = {
  AppInit: [];
  UserLogin: [];
  AuthLogin: [LoginResponseDto];
  AuthLogout: [];
  LanguageChange: [{ name: string; code: string; rtl?: boolean }];
  ThemeChange: [ThemeSetting];

  AssetReplace: [{ oldAssetId: string; newAssetId: string }];

  AlbumDelete: [AlbumResponseDto];

  SharedLinkCreate: [SharedLinkResponseDto];
  SharedLinkUpdate: [SharedLinkResponseDto];
  SharedLinkDelete: [SharedLinkResponseDto];

  UserAdminCreate: [UserAdminResponseDto];
  UserAdminUpdate: [UserAdminResponseDto];
  UserAdminDelete: [UserAdminResponseDto];
  UserAdminRestore: [UserAdminResponseDto];

  SystemConfigUpdate: [SystemConfigDto];

  LibraryCreate: [LibraryResponseDto];
  LibraryUpdate: [LibraryResponseDto];
  LibraryDelete: [{ id: string }];
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
