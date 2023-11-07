import { CreateUserDto, IMMICH_PRIVATE_ALBUM_ACCESS_COOKIE, UpdateUserDto, UserResponseDto } from '@app/domain';
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
  get: async (server: any, accessToken: string, id: string) => {
    const { status, body } = await request(server)
      .get(`/user/info/${id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(status).toBe(200);
    expect(body).toMatchObject({ id });

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
  delete: async (server: any, accessToken: string, id: string) => {
    const { status, body } = await request(server).delete(`/user/${id}`).set('Authorization', `Bearer ${accessToken}`);

    expect(status).toBe(200);
    expect(body).toMatchObject({ id, deletedAt: expect.any(String) });

    return body as UserResponseDto;
  },
  validatePrivateAlbumPassword: async (server: any, accessToken: string, privateAlbumPassword: string) => {
    const { status, headers } = await request(server)
      .post('/user/validate-private-album-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: privateAlbumPassword });

    expect(status).toBe(201);
    expect(headers['set-cookie']).toHaveLength(1);
    expect(headers['set-cookie'][0]).toMatch(new RegExp(`${IMMICH_PRIVATE_ALBUM_ACCESS_COOKIE}=.+; Path=/;.*`));

    return decodeURIComponent(headers['set-cookie'][0].split(';')[0].split('=')[1]);
  },
};
