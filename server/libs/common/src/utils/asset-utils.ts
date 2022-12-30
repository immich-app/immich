import { AssetEntity } from '@app/database';
import { AssetResponseDto } from 'apps/immich/src/api-v1/asset/response-dto/asset-response.dto';
import fs from 'fs';

const deleteFiles = (asset: AssetEntity | AssetResponseDto) => {
  fs.unlink(asset.originalPath, (err) => {
    if (err) {
      console.log('error deleting ', asset.originalPath);
    }
  });

  // TODO: what if there is no asset.resizePath. Should fail the Job?
  // => panoti report: Job not fail
  if (asset.resizePath) {
    fs.unlink(asset.resizePath, (err) => {
      if (err) {
        console.log('error deleting ', asset.resizePath);
      }
    });
  }

  if (asset.webpPath) {
    fs.unlink(asset.webpPath, (err) => {
      if (err) {
        console.log('error deleting ', asset.webpPath);
      }
    });
  }

  if (asset.encodedVideoPath) {
    fs.unlink(asset.encodedVideoPath, (err) => {
      if (err) {
        console.log('error deleting ', asset.encodedVideoPath);
      }
    });
  }
};

export const assetUtils = { deleteFiles };
