import { mapAlbum } from 'src/dtos/album.dto';
import { albumStub } from 'test/fixtures/album.stub';

describe('mapAlbum', () => {
  it('should set start and end dates', () => {
    const dto = mapAlbum(albumStub.twoAssets, false);
    expect(dto.startDate).toEqual(new Date('2020-12-31T23:59:00.000Z'));
    expect(dto.endDate).toEqual(new Date('2025-01-01T01:02:03.456Z'));
  });

  it('should not set start and end dates for empty assets', () => {
    const dto = mapAlbum(albumStub.empty, false);
    expect(dto.startDate).toBeUndefined();
    expect(dto.endDate).toBeUndefined();
  });
});
