import { mapAlbum } from 'src/dtos/album.dto';
import { albumStub } from 'test/fixtures/album.stub';

describe('mapAlbum', () => {
  it('should set start and end dates', () => {
    const dto = mapAlbum(albumStub.twoAssets, false);
    expect(dto.startDate).toEqual(new Date('2023-02-22T05:06:29.716Z'));
    expect(dto.endDate).toEqual(new Date('2023-02-23T05:06:29.716Z'));
  });

  it('should not set start and end dates for empty assets', () => {
    const dto = mapAlbum(albumStub.empty, false);
    expect(dto.startDate).toBeUndefined();
    expect(dto.endDate).toBeUndefined();
  });
});
