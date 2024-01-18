import { PartnerResponseDto } from '@app/domain';
import request from 'supertest';

export const partnerApi = {
  create: async (server: any, accessToken: string, id: string) => {
    const { status, body } = await request(server).post(`/partner/${id}`).set('Authorization', `Bearer ${accessToken}`);
    expect(status).toBe(201);
    return body as PartnerResponseDto;
  },
};
