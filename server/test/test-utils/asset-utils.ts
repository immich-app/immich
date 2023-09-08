import { AssetFileUploadResponseDto } from '@app/immich/api-v1/asset/response-dto/asset-file-upload-response.dto';
import { randomBytes } from 'crypto';
import request from 'supertest';
import { AssetResponseDto } from '../../src/domain';

export const assetApi = {
  get: async (server: any, accessToken: string, id: string) => {
    const { body, status } = await request(server)
      .get(`/asset/assetById/${id}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(status).toBe(200);
    return body as AssetResponseDto;
  },
  upload: async (server: any, accessToken: string, id: string, content?: Buffer) => {
    const { body, status } = await request(server)
      .post('/asset/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('deviceAssetId', id)
      .field('deviceId', 'TEST')
      .field('fileCreatedAt', new Date().toISOString())
      .field('fileModifiedAt', new Date().toISOString())
      .field('isFavorite', false)
      .field('duration', '0:00:00.000000')
      .attach('assetData', content || randomBytes(32), 'example.jpg');

    expect(status).toBe(201);
    return body as AssetFileUploadResponseDto;
  },
};
