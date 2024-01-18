import { ServerConfigDto } from '@app/domain';
import request from 'supertest';

export const serverInfoApi = {
  getConfig: async (server: any) => {
    const res = await request(server).get('/server-info/config');
    expect(res.status).toBe(200);
    return res.body as ServerConfigDto;
  },
};
