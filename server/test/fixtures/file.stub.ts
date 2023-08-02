export const fileStub = {
  livePhotoStill: Object.freeze({
    originalPath: 'fake_path/asset_1.jpeg',
    checksum: Buffer.from('file hash', 'utf8'),
    originalName: 'asset_1.jpeg',
  }),
  livePhotoMotion: Object.freeze({
    originalPath: 'fake_path/asset_1.mp4',
    checksum: Buffer.from('live photo file hash', 'utf8'),
    originalName: 'asset_1.mp4',
  }),
};
