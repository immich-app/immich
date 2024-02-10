import {
  CreateLibraryDto,
  LibraryResponseDto,
  LibraryStatsResponseDto,
  ScanLibraryDto,
  UpdateLibraryDto,
} from '@app/domain';
import request from 'supertest';

export const libraryApi = {
  getAll: async (server: any, accessToken: string) => {
    const { body, status } = await request(server).get(`/library/`).set('Authorization', `Bearer ${accessToken}`);
    expect(status).toBe(200);
    return body as LibraryResponseDto[];
  },
  create: async (server: any, accessToken: string, dto: CreateLibraryDto) => {
    const { body, status } = await request(server)
      .post(`/library/`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto);
    expect(status).toBe(201);
    return body as LibraryResponseDto;
  },
  setImportPaths: async (server: any, accessToken: string, id: string, importPaths: string[]) => {
    const { body, status } = await request(server)
      .put(`/library/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ importPaths });
    expect(status).toBe(200);
    return body as LibraryResponseDto;
  },
  scanLibrary: async (server: any, accessToken: string, id: string, dto: ScanLibraryDto = {}) => {
    const { status } = await request(server)
      .post(`/library/${id}/scan`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto);
    expect(status).toBe(201);
  },
  removeOfflineFiles: async (server: any, accessToken: string, id: string) => {
    const { status } = await request(server)
      .post(`/library/${id}/removeOffline`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
    expect(status).toBe(201);
  },
  getLibraryStatistics: async (server: any, accessToken: string, id: string): Promise<LibraryStatsResponseDto> => {
    const { body, status } = await request(server)
      .get(`/library/${id}/statistics`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(status).toBe(200);
    return body;
  },
  update: async (server: any, accessToken: string, id: string, data: UpdateLibraryDto) => {
    const { body, status } = await request(server)
      .put(`/library/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(data);
    expect(status).toBe(200);
    return body as LibraryResponseDto;
  },
};
