import { AddUsersDto, AlbumResponseDto, BulkIdResponseDto, BulkIdsDto, CreateAlbumDto } from '@app/domain';
import request from 'supertest';

export const albumApi = {
  create: async (server: any, accessToken: string, dto: CreateAlbumDto) => {
    const res = await request(server).post('/album').set('Authorization', `Bearer ${accessToken}`).send(dto);
    expect(res.status).toEqual(201);
    return res.body as AlbumResponseDto;
  },
  addAssets: async (server: any, accessToken: string, id: string, dto: BulkIdsDto) => {
    const res = await request(server)
      .put(`/album/${id}/assets`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto);
    expect(res.status).toEqual(200);
    return res.body as BulkIdResponseDto[];
  },
  addUsers: async (server: any, accessToken: string, id: string, dto: AddUsersDto) => {
    const res = await request(server).put(`/album/${id}/users`).set('Authorization', `Bearer ${accessToken}`).send(dto);
    expect(res.status).toEqual(200);
    return res.body as AlbumResponseDto;
  },
  getAllAlbums: async (server: any, accessToken: string) => {
    const res = await request(server).get(`/album/`).set('Authorization', `Bearer ${accessToken}`).send();
    expect(res.status).toEqual(200);
    return res.body as AlbumResponseDto[];
  },
};
