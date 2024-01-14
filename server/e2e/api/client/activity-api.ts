import { ActivityCreateDto, ActivityResponseDto } from '@app/domain';
import request from 'supertest';

export const activityApi = {
  create: async (server: any, accessToken: string, dto: ActivityCreateDto) => {
    const res = await request(server).post('/activity').set('Authorization', `Bearer ${accessToken}`).send(dto);
    expect(res.status === 200 || res.status === 201).toBe(true);
    return res.body as ActivityResponseDto;
  },
  delete: async (server: any, accessToken: string, id: string) => {
    const res = await request(server).delete(`/activity/${id}`).set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toEqual(204);
  },
};
