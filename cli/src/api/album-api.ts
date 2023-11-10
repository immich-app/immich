import axios from 'axios';

import { AlbumResponseDto, CreateAlbumDto } from './open-api';
import { auth } from './auth';

export const albumApi = {
  createAlbum: async (server: any, accessToken: string, dto: CreateAlbumDto) => {
    const res = await axios.post(`${server}/album`, dto, auth(accessToken));
    return res.data as AlbumResponseDto;
  },
};
