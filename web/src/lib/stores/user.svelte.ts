import { eventManager } from '$lib/managers/event-manager.svelte';
import type {
  AlbumResponseDto,
  ServerAboutResponseDto,
  ServerStatsResponseDto,
  ServerStorageResponseDto,
  ServerVersionHistoryResponseDto,
} from '@immich/sdk';

interface UserInteractions {
  recentAlbums?: AlbumResponseDto[];
  versions?: ServerVersionHistoryResponseDto[];
  aboutInfo?: ServerAboutResponseDto;
  serverInfo?: ServerStorageResponseDto;
  serverStats?: ServerStatsResponseDto;
}

const defaultUserInteraction: UserInteractions = {
  recentAlbums: undefined,
  versions: undefined,
  aboutInfo: undefined,
  serverInfo: undefined,
  serverStats: undefined,
};

export const userInteraction = $state<UserInteractions>(defaultUserInteraction);

const reset = () => {
  Object.assign(userInteraction, defaultUserInteraction);
};

eventManager.on('AuthLogout', () => reset());
