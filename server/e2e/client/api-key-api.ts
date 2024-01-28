import { APIKeyCreateResponseDto } from 'src/domain';
import request from 'supertest';
import { apiKeyCreateStub } from 'test';

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
