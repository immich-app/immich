import { AssetFileUploadResponseDto } from '@app/immich/api-v1/asset/response-dto/asset-file-upload-response.dto';
import { randomBytes } from 'crypto';
import request from 'supertest';

export const assetApi = {
  upload: async (server: any, accessToken: string, id: string, content?: Buffer) => {
    const response = await request(server)
      .post('/asset/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('deviceAssetId', id)
      .field('deviceId', 'TEST')
      .field('fileCreatedAt', new Date().toISOString())
      .field('fileModifiedAt', new Date().toISOString())
      .field('isFavorite', false)
      .field('duration', '0:00:00.000000')
      .attach('assetData', content || randomBytes(32), 'example.jpg');

    return { asset: response.body as AssetFileUploadResponseDto, status: response.status };
  },
};
