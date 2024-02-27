import { CreateUserDto, UpdateUserDto, UserResponseDto } from '@app/domain';
import request from 'supertest';

export const userApi = {
  create: async (server: any, accessToken: string, dto: CreateUserDto) => {
    const { status, body } = await request(server)
      .post('/user')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto);

    expect(status).toBe(201);
    expect(body).toMatchObject({
      id: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      email: dto.email,
    });

    return body as UserResponseDto;
  },
  update: async (server: any, accessToken: string, dto: UpdateUserDto) => {
    const { status, body } = await request(server).put('/user').set('Authorization', `Bearer ${accessToken}`).send(dto);

    expect(status).toBe(200);
    expect(body).toMatchObject({ id: dto.id });

    return body as UserResponseDto;
  },
  setExternalPath: async (server: any, accessToken: string, id: string, externalPath: string) => {
    return await userApi.update(server, accessToken, { id, externalPath });
  },
};
