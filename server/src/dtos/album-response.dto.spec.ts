import { mapAlbum } from 'src/dtos/album.dto';
import { AlbumFactory } from 'test/factories/album.factory';

describe('mapAlbum', () => {
  it('should set start and end dates', () => {
    const startDate = new Date('2023-02-22T05:06:29.716Z');
    const endDate = new Date('2025-01-01T01:02:03.456Z');
    const album = AlbumFactory.from().asset({ localDateTime: endDate }).asset({ localDateTime: startDate }).build();
    const dto = mapAlbum(album, false);
    expect(dto.startDate).toEqual(startDate);
    expect(dto.endDate).toEqual(endDate);
  });

  it('should not set start and end dates for empty assets', () => {
    const dto = mapAlbum(AlbumFactory.create(), false);
    expect(dto.startDate).toBeUndefined();
    expect(dto.endDate).toBeUndefined();
  });
});
