export const fileStub = {
  livePhotoStill: Object.freeze({
    uuid: 'random-uuid',
    originalPath: 'fake_path/asset_1.jpeg',
    checksum: Buffer.from('file hash', 'utf8'),
    originalName: 'asset_1.jpeg',
  }),
  livePhotoMotion: Object.freeze({
    uuid: 'random-uuid',
    originalPath: 'fake_path/asset_1.mp4',
    checksum: Buffer.from('live photo file hash', 'utf8'),
    originalName: 'asset_1.mp4',
  }),
};
