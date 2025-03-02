import {
  type AlbumModalRow,
  AlbumModalRowConverter,
  AlbumModalRowType,
} from '$lib/components/shared-components/album-selection/album-selection-utils';
import { AlbumSortBy, SortOrder } from '$lib/stores/preferences.store';
import type { AlbumResponseDto } from '@immich/sdk';
import { albumFactory } from '@test-data/factories/album-factory';

// Some helper functions to make tests below more readable
const createNewAlbumRow = (selected: boolean) => ({
  type: AlbumModalRowType.NEW_ALBUM,
  selected,
});
const createMessageRow = (message: string): AlbumModalRow => ({
  type: AlbumModalRowType.MESSAGE,
  text: message,
});
const createSectionRow = (message: string): AlbumModalRow => ({
  type: AlbumModalRowType.SECTION,
  text: message,
});
const createAlbumRow = (album: AlbumResponseDto, selected: boolean) => ({
  type: AlbumModalRowType.ALBUM_ITEM,
  album,
  selected,
});

describe('Album Modal', () => {
  it('non-shared with no albums configured yet shows message and new', () => {
    const converter = new AlbumModalRowConverter(false, AlbumSortBy.MostRecentPhoto, SortOrder.Desc);
    const modalRows = converter.toModalRows('', [], [], -1);

    expect(modalRows).toStrictEqual([createNewAlbumRow(false), createMessageRow('no_albums_yet')]);
  });

  it('non-shared with no matching albums shows message and new', () => {
    const converter = new AlbumModalRowConverter(false, AlbumSortBy.MostRecentPhoto, SortOrder.Desc);
    const modalRows = converter.toModalRows('matches_nothing', [], [albumFactory.build({ albumName: 'Holidays' })], -1);

    expect(modalRows).toStrictEqual([createNewAlbumRow(false), createMessageRow('no_albums_with_name_yet')]);
  });

  it('non-shared displays single albums', () => {
    const converter = new AlbumModalRowConverter(false, AlbumSortBy.MostRecentPhoto, SortOrder.Desc);
    const holidayAlbum = albumFactory.build({ albumName: 'Holidays' });
    const modalRows = converter.toModalRows('', [], [holidayAlbum], -1);

    expect(modalRows).toStrictEqual([
      createNewAlbumRow(false),
      createSectionRow('ALL_ALBUMS'),
      createAlbumRow(holidayAlbum, false),
    ]);
  });

  it('non-shared displays multiple albums and recents', () => {
    const converter = new AlbumModalRowConverter(false, AlbumSortBy.MostRecentPhoto, SortOrder.Desc);
    const holidayAlbum = albumFactory.build({ albumName: 'Holidays' });
    const constructionAlbum = albumFactory.build({ albumName: 'Construction' });
    const birthdayAlbum = albumFactory.build({ albumName: 'Birthday' });
    const christmasAlbum = albumFactory.build({ albumName: 'Christmas' });
    const modalRows = converter.toModalRows(
      '',
      [holidayAlbum, constructionAlbum],
      [holidayAlbum, constructionAlbum, birthdayAlbum, christmasAlbum],
      -1,
    );

    expect(modalRows).toStrictEqual([
      createNewAlbumRow(false),
      createSectionRow('RECENT'),
      createAlbumRow(holidayAlbum, false),
      createAlbumRow(constructionAlbum, false),
      createSectionRow('ALL_ALBUMS'),
      createAlbumRow(holidayAlbum, false),
      createAlbumRow(constructionAlbum, false),
      createAlbumRow(birthdayAlbum, false),
      createAlbumRow(christmasAlbum, false),
    ]);
  });

  it('shared only displays albums and no recents', () => {
    const converter = new AlbumModalRowConverter(true, AlbumSortBy.MostRecentPhoto, SortOrder.Desc);
    const holidayAlbum = albumFactory.build({ albumName: 'Holidays' });
    const constructionAlbum = albumFactory.build({ albumName: 'Construction' });
    const birthdayAlbum = albumFactory.build({ albumName: 'Birthday' });
    const christmasAlbum = albumFactory.build({ albumName: 'Christmas' });
    const modalRows = converter.toModalRows(
      '',
      [holidayAlbum, constructionAlbum],
      [holidayAlbum, constructionAlbum, birthdayAlbum, christmasAlbum],
      -1,
    );

    expect(modalRows).toStrictEqual([
      createNewAlbumRow(false),
      createAlbumRow(holidayAlbum, false),
      createAlbumRow(constructionAlbum, false),
      createAlbumRow(birthdayAlbum, false),
      createAlbumRow(christmasAlbum, false),
    ]);
  });

  it('search changes messaging and removes recent and non-matching albums', () => {
    const converter = new AlbumModalRowConverter(false, AlbumSortBy.MostRecentPhoto, SortOrder.Desc);
    const holidayAlbum = albumFactory.build({ albumName: 'Holidays' });
    const constructionAlbum = albumFactory.build({ albumName: 'Construction' });
    const birthdayAlbum = albumFactory.build({ albumName: 'Birthday' });
    const christmasAlbum = albumFactory.build({ albumName: 'Christmas' });
    const modalRows = converter.toModalRows(
      'Cons',
      [holidayAlbum, constructionAlbum],
      [holidayAlbum, constructionAlbum, birthdayAlbum, christmasAlbum],
      -1,
    );

    expect(modalRows).toStrictEqual([
      createNewAlbumRow(false),
      createSectionRow('ALBUMS'),
      createAlbumRow(constructionAlbum, false),
    ]);
  });

  it('selection can select new album row', () => {
    const converter = new AlbumModalRowConverter(false, AlbumSortBy.MostRecentPhoto, SortOrder.Desc);
    const holidayAlbum = albumFactory.build({ albumName: 'Holidays' });
    const constructionAlbum = albumFactory.build({ albumName: 'Construction' });
    const modalRows = converter.toModalRows('', [holidayAlbum], [holidayAlbum, constructionAlbum], 0);

    expect(modalRows).toStrictEqual([
      createNewAlbumRow(true),
      createSectionRow('RECENT'),
      createAlbumRow(holidayAlbum, false),
      createSectionRow('ALL_ALBUMS'),
      createAlbumRow(holidayAlbum, false),
      createAlbumRow(constructionAlbum, false),
    ]);
  });

  it('selection can select recent row', () => {
    const converter = new AlbumModalRowConverter(false, AlbumSortBy.MostRecentPhoto, SortOrder.Desc);
    const holidayAlbum = albumFactory.build({ albumName: 'Holidays' });
    const constructionAlbum = albumFactory.build({ albumName: 'Construction' });
    const modalRows = converter.toModalRows('', [holidayAlbum], [holidayAlbum, constructionAlbum], 1);

    expect(modalRows).toStrictEqual([
      createNewAlbumRow(false),
      createSectionRow('RECENT'),
      createAlbumRow(holidayAlbum, true),
      createSectionRow('ALL_ALBUMS'),
      createAlbumRow(holidayAlbum, false),
      createAlbumRow(constructionAlbum, false),
    ]);
  });

  it('selection can select last row', () => {
    const converter = new AlbumModalRowConverter(false, AlbumSortBy.MostRecentPhoto, SortOrder.Desc);
    const holidayAlbum = albumFactory.build({ albumName: 'Holidays' });
    const constructionAlbum = albumFactory.build({ albumName: 'Construction' });
    const modalRows = converter.toModalRows('', [holidayAlbum], [holidayAlbum, constructionAlbum], 3);

    expect(modalRows).toStrictEqual([
      createNewAlbumRow(false),
      createSectionRow('RECENT'),
      createAlbumRow(holidayAlbum, false),
      createSectionRow('ALL_ALBUMS'),
      createAlbumRow(holidayAlbum, false),
      createAlbumRow(constructionAlbum, true),
    ]);
  });
});
