import type { AlbumResponseDto } from '@immich/sdk';

export enum AlbumModalRowType {
  SECTION = 'section',
  MESSAGE = 'message',
  NEW_ALBUM = 'newAlbum',
  ALBUM_ITEM = 'albumItem',
}

export type AlbumModalRow = {
  type: AlbumModalRowType;
  selected?: boolean;
  text?: string;
  album?: AlbumResponseDto;
};
