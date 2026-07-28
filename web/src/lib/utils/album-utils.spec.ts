import { filterAlbums } from '$lib/utils/album-utils';
import { albumFactory } from '@test-data/factories/album-factory';

describe('filterAlbums', () => {
  const foodAlbum = albumFactory.build({ albumName: 'Food', description: 'Cooking, Baking, Eating' });
  const holidayAlbum = albumFactory.build({ albumName: 'Holidays', description: '' });
  const albums = [foodAlbum, holidayAlbum];

  it('returns all albums when the search is empty', () => {
    expect(filterAlbums(albums, '')).toStrictEqual(albums);
  });

  it('matches album names', () => {
    expect(filterAlbums(albums, 'holi')).toStrictEqual([holidayAlbum]);
  });

  it('matches album descriptions', () => {
    expect(filterAlbums(albums, 'baking')).toStrictEqual([foodAlbum]);
  });

  it('ignores case and accents', () => {
    expect(filterAlbums(albums, 'HÔLI')).toStrictEqual([holidayAlbum]);
  });

  it('returns nothing when neither name nor description matches', () => {
    expect(filterAlbums(albums, 'matches_nothing')).toStrictEqual([]);
  });
});
