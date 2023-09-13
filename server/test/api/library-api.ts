import { LibraryResponseDto } from '@app/domain';
import request from 'supertest';

export const libraryApi = {
  getAll: async (server: any, accessToken: string) => {
    const { body, status } = await request(server).get(`/library/`).set('Authorization', `Bearer ${accessToken}`);
    expect(status).toBe(200);
    return body as LibraryResponseDto[];
  },
};
