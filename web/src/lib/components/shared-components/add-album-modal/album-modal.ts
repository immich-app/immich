import type { AlbumResponseDto } from '@immich/sdk';

export const SCROLL_PROPERTIES: ScrollIntoViewOptions = { block: 'center', behavior: 'smooth' };

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

export const isSelectableRowType = (type: AlbumModalRowType) =>
  type === AlbumModalRowType.NEW_ALBUM || type === AlbumModalRowType.ALBUM_ITEM;
