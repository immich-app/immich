import { Selectable } from 'kysely';
import { AssetExifTable } from 'src/schema/tables/asset-exif.table';
import { AssetExifLike } from 'test/factories/types';
import { factory } from 'test/small.factory';

export class AssetExifFactory {
  private constructor(private readonly value: Selectable<AssetExifTable>) {}

  static create(dto: AssetExifLike = {}) {
    return AssetExifFactory.from(dto).build();
  }

  static from(dto: AssetExifLike = {}) {
    return new AssetExifFactory({
      updatedAt: factory.date(),
      updateId: factory.uuid(),
      assetId: factory.uuid(),
      autoStackId: null,
      bitsPerSample: null,
      city: 'Austin',
      colorspace: null,
      country: 'United States of America',
      dateTimeOriginal: factory.date(),
      description: '',
      exifImageHeight: 420,
      exifImageWidth: 42,
      exposureTime: null,
      fileSizeInByte: 69,
      fNumber: 1.7,
      focalLength: 4.38,
      fps: null,
      iso: 947,
      latitude: 30.267_334_570_570_195,
      longitude: -97.789_833_534_282_07,
      lensModel: null,
      livePhotoCID: null,
      make: 'Google',
      model: 'Pixel 7',
      modifyDate: factory.date(),
      orientation: '1',
      profileDescription: null,
      projectionType: null,
      rating: 4,
      lockedProperties: [],
      state: 'Texas',
      tags: ['parent/child'],
      timeZone: 'UTC-6',
      ...dto,
    });
  }

  build() {
    return { ...this.value };
  }
}
