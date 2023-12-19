import { APIKeyCreateResponseDto } from '@app/domain';
import { apiKeyCreateStub } from '@test';
import request from 'supertest';

export const apiKeyApi = {
  createApiKey: async (server: any, accessToken: string) => {
    const { status, body } = await request(server)
      .post('/api-key')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(apiKeyCreateStub);

    expect(status).toBe(201);

    return body as APIKeyCreateResponseDto;
  },
};
