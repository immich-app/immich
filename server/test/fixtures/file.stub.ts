export const fileStub = {
  livePhotoStill: Object.freeze({
    uuid: 'random-uuid',
    originalPath: 'fake_path/asset_1.jpeg',
    checksum: Buffer.from('file hash', 'utf8'),
    originalName: 'asset_1.jpeg',
    size: 42,
  }),
  livePhotoMotion: Object.freeze({
    uuid: 'live-photo-motion-asset',
    originalPath: 'fake_path/asset_1.mp4',
    checksum: Buffer.from('live photo file hash', 'utf8'),
    originalName: 'asset_1.mp4',
    size: 69,
  }),
  photo: Object.freeze({
    uuid: 'photo',
    originalPath: 'fake_path/photo1.jpeg',
    mimeType: 'image/jpeg',
    checksum: Buffer.from('photo file hash', 'utf8'),
    originalName: 'photo1.jpeg',
    size: 24,
  }),
  photoSidecar: Object.freeze({
    uuid: 'photo-sidecar',
    originalPath: 'fake_path/photo1.jpeg.xmp',
    originalName: 'photo1.jpeg.xmp',
    checksum: Buffer.from('photo-sidecar file hash', 'utf8'),
    size: 96,
  }),
};
