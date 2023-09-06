import { AssetFileUploadResponseDto } from '@app/immich/api-v1/asset/response-dto/asset-file-upload-response.dto';
import fs from 'fs';
import request from 'supertest';

export const assetApi = {
  upload: async (server: any, accessToken: string, id: string, path: string) => {
    const { ctime, mtime } = fs.statSync(path);
    const response = await request(server)
      .post('/asset/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('deviceAssetId', id)
      .field('deviceId', 'TEST')
      .field('fileCreatedAt', ctime.toISOString())
      .field('fileModifiedAt', mtime.toISOString())
      .field('isFavorite', false)
      .field('duration', '0:00:00.000000')
      .attach('assetData', path);

    return { asset: response.body as AssetFileUploadResponseDto, status: response.status };
  },
};
