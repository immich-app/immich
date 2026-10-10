import type { AlbumResponseDto, ServerVersionHistoryResponseDto } from '@immich/sdk';
import { eventManager } from '$lib/managers/event-manager.svelte';

interface UserInteractions {
  recentAlbums?: AlbumResponseDto[];
  versions?: ServerVersionHistoryResponseDto[];
}

const defaultUserInteraction: UserInteractions = {
  recentAlbums: undefined,
  versions: undefined,
};

export const userInteraction = $state<UserInteractions>(defaultUserInteraction);

const resetRecentAlbums = () => {
  userInteraction.recentAlbums = undefined;
};

const reset = () => {
  Object.assign(userInteraction, defaultUserInteraction);
};

// eslint-disable-next-line unicorn/no-top-level-side-effects
eventManager.on({
  AlbumCreate: () => resetRecentAlbums(),
  AlbumUpdate: () => resetRecentAlbums(),
  AlbumDelete: () => resetRecentAlbums(),
  AuthLogout: () => reset(),
});
