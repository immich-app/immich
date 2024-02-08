import { AssetResponseDto } from '@app/domain';
import { CreateAssetDto } from '@app/immich/api-v1/asset/dto/create-asset.dto';
import { AssetFileUploadResponseDto } from '@app/immich/api-v1/asset/response-dto/asset-file-upload-response.dto';
import { randomBytes } from 'node:crypto';
import request from 'supertest';

type UploadDto = Partial<CreateAssetDto> & { content?: Buffer; filename?: string };

const asset = {
  deviceAssetId: 'test-1',
  deviceId: 'test',
  fileCreatedAt: new Date(),
  fileModifiedAt: new Date(),
};

export const assetApi = {
  create: async (
    server: any,
    accessToken: string,
    dto?: Omit<CreateAssetDto, 'assetData'>,
  ): Promise<AssetResponseDto> => {
    dto = dto || asset;
    const { status, body } = await request(server)
      .post(`/asset/upload`)
      .field('deviceAssetId', dto.deviceAssetId)
      .field('deviceId', dto.deviceId)
      .field('fileCreatedAt', dto.fileCreatedAt.toISOString())
      .field('fileModifiedAt', dto.fileModifiedAt.toISOString())
      .attach('assetData', randomBytes(32), 'example.jpg')
      .set('Authorization', `Bearer ${accessToken}`);

    expect([200, 201].includes(status)).toBe(true);

    return body as AssetResponseDto;
  },
  get: async (server: any, accessToken: string, id: string): Promise<AssetResponseDto> => {
    const { body, status } = await request(server).get(`/asset/${id}`).set('Authorization', `Bearer ${accessToken}`);
    expect(status).toBe(200);
    return body as AssetResponseDto;
  },
  getAllAssets: async (server: any, accessToken: string) => {
    const { body, status } = await request(server).get(`/asset/`).set('Authorization', `Bearer ${accessToken}`);
    expect(status).toBe(200);
    return body as AssetResponseDto[];
  },
  upload: async (server: any, accessToken: string, deviceAssetId: string, dto: UploadDto = {}) => {
    const { content, filename, isFavorite = false, isArchived = false } = dto;
    const { body, status } = await request(server)
      .post('/asset/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('deviceAssetId', deviceAssetId)
      .field('deviceId', 'TEST')
      .field('fileCreatedAt', new Date().toISOString())
      .field('fileModifiedAt', new Date().toISOString())
      .field('isFavorite', isFavorite)
      .field('isArchived', isArchived)
      .field('duration', '0:00:00.000000')
      .attach('assetData', content || randomBytes(32), filename || 'example.jpg');

    expect(status).toBe(201);
    return body as AssetFileUploadResponseDto;
  },
  getWebpThumbnail: async (server: any, accessToken: string, assetId: string) => {
    const { body, status } = await request(server)
      .get(`/asset/thumbnail/${assetId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(status).toBe(200);
    return body;
  },
  getJpegThumbnail: async (server: any, accessToken: string, assetId: string) => {
    const { body, status } = await request(server)
      .get(`/asset/thumbnail/${assetId}?format=JPEG`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(status).toBe(200);
    return body;
  },
};
