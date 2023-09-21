import { AllJobStatusResponseDto } from '@app/domain';
import request from 'supertest';

export const jobApi = {
  getAllJobsStatus: async (server: any, accessToken: string) => {
    const { body, status } = await request(server).get(`/jobs/`).set('Authorization', `Bearer ${accessToken}`);
    expect(status).toBe(200);
    return body as AllJobStatusResponseDto;
  },
};
