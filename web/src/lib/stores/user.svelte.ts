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

export const userInteraction = $state<UserInteractions>({
  recentAlbums: undefined,
  versions: undefined,
  aboutInfo: undefined,
  serverInfo: undefined,
});
