import { sortAlbums } from '$lib/utils/album-utils';
import { normalizeSearchString } from '$lib/utils/string-utils';
import type { AlbumResponseDto } from '@immich/sdk';
import { type MessageFormatter } from 'svelte-i18n';

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

export class AlbumModalRowConverter {
  private readonly shared: boolean;
  private readonly sortBy: string;
  private readonly orderBy: string;
  private readonly $t: MessageFormatter;

  constructor($t: MessageFormatter, shared: boolean, sortBy: string, orderBy: string) {
    this.$t = $t;
    this.shared = shared;
    this.sortBy = sortBy;
    this.orderBy = orderBy;
  }

  toModalRows(
    search: string,
    recentAlbums: AlbumResponseDto[],
    albums: AlbumResponseDto[],
    selectedRowIndex: number,
  ): AlbumModalRow[] {
    // only show recent albums if no search was entered, or we're in the normal albums (non-shared) modal.
    const recentAlbumsToShow = !this.shared && search.length === 0 ? recentAlbums : [];
    const rows: AlbumModalRow[] = [];
    rows.push({ type: AlbumModalRowType.NEW_ALBUM, selected: selectedRowIndex === 0 });

    const filteredAlbums = sortAlbums(
      search.length > 0 && albums.length > 0
        ? albums.filter((album) => {
            return normalizeSearchString(album.albumName).includes(normalizeSearchString(search));
          })
        : albums,
      { sortBy: this.sortBy, orderBy: this.orderBy },
    );

    if (filteredAlbums.length > 0) {
      if (recentAlbumsToShow.length > 0) {
        rows.push({ type: AlbumModalRowType.SECTION, text: this.$t('recent').toUpperCase() });
        const selectedOffsetDueToNewAlbumRow = 1;
        for (const [i, album] of recentAlbums.entries()) {
          rows.push({
            type: AlbumModalRowType.ALBUM_ITEM,
            selected: selectedRowIndex === i + selectedOffsetDueToNewAlbumRow,
            album,
          });
        }
      }

      if (!this.shared) {
        rows.push({
          type: AlbumModalRowType.SECTION,
          text: (search.length === 0 ? this.$t('all_albums') : this.$t('albums')).toUpperCase(),
        });
      }

      const selectedOffsetDueToNewAndRecents = 1 + recentAlbumsToShow.length;
      for (const [i, album] of filteredAlbums.entries()) {
        rows.push({
          type: AlbumModalRowType.ALBUM_ITEM,
          selected: selectedRowIndex === i + selectedOffsetDueToNewAndRecents,
          album,
        });
      }
    } else if (albums.length > 0) {
      rows.push({ type: AlbumModalRowType.MESSAGE, text: this.$t('no_albums_with_name_yet') });
    } else {
      rows.push({ type: AlbumModalRowType.MESSAGE, text: this.$t('no_albums_yet') });
    }
    return rows;
  }
}
