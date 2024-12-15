import type {
  AlbumResponseDto,
  ServerAboutResponseDto,
  ServerStorageResponseDto,
  ServerVersionHistoryResponseDto,
} from '@immich/sdk';

interface UserInteractions {
  recentAlbums?: AlbumResponseDto[];
  versions?: ServerVersionHistoryResponseDto[];
  aboutInfo?: ServerAboutResponseDto;
  serverInfo?: ServerStorageResponseDto;
}

const defaultUserInteraction: UserInteractions = {
  recentAlbums: undefined,
  versions: undefined,
  aboutInfo: undefined,
  serverInfo: undefined,
};

export const resetUserInteraction = () => {
  Object.assign(userInteraction, defaultUserInteraction);
};

export const userInteraction = $state<UserInteractions>(defaultUserInteraction);
