import { mapAlbum } from 'src/dtos/album.dto';
import { AlbumFactory } from 'test/factories/album.factory';
import { getForAlbum } from 'test/mappers';

describe('mapAlbum', () => {
  it('should set start and end dates', () => {
    const startDate = new Date('2023-02-22T05:06:29.716Z');
    const endDate = new Date('2025-01-01T01:02:03.456Z');
    const album = AlbumFactory.from()
      .asset({ localDateTime: endDate }, (builder) => builder.exif())
      .asset({ localDateTime: startDate }, (builder) => builder.exif())
      .build();
    const dto = mapAlbum(getForAlbum(album), false);
    expect(dto.startDate).toEqual(startDate.toISOString());
    expect(dto.endDate).toEqual(endDate.toISOString());
  });

  it('should not set start and end dates for empty assets', () => {
    const dto = mapAlbum(getForAlbum(AlbumFactory.create()), false);
    expect(dto.startDate).toBeUndefined();
    expect(dto.endDate).toBeUndefined();
  });
});
