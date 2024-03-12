import { AssetResponseDto } from '@app/domain';
import request from 'supertest';

export const assetApi = {
  getAllAssets: async (server: any, accessToken: string) => {
    const { body, status } = await request(server).get(`/asset/`).set('Authorization', `Bearer ${accessToken}`);
    expect(status).toBe(200);
    return body as AssetResponseDto[];
  },
};
