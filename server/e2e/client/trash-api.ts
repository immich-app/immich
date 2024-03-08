import request from 'supertest';
import type { App } from 'supertest/types';

export const trashApi = {
  async empty(server: App, accessToken: string) {
    const { status } = await request(server).post('/trash/empty').set('Authorization', `Bearer ${accessToken}`);
    expect(status).toBe(204);
  },
  async restore(server: App, accessToken: string) {
    const { status } = await request(server).post('/trash/restore').set('Authorization', `Bearer ${accessToken}`);
    expect(status).toBe(204);
  },
};
