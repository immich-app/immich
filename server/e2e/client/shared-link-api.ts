import { SharedLinkCreateDto, SharedLinkResponseDto } from '@app/domain';
import request from 'supertest';

export const sharedLinkApi = {
  create: async (server: any, accessToken: string, dto: SharedLinkCreateDto) => {
    const { status, body } = await request(server)
      .post('/shared-link')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto);
    expect(status).toBe(201);
    return body as SharedLinkResponseDto;
  },
};
