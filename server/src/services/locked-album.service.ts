import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthDto } from 'src/dtos/auth.dto.js';
import {
  CreateLockedAlbumDto,
  GetLockedAlbumAssetsDto,
  LockedAlbumAssetsDto,
  LockedAlbumAssetsResponseDto,
  LockedAlbumResponseDto,
  UpdateLockedAlbumDto,
  mapLockedAlbum,
} from 'src/dtos/locked-album.dto.js';
import { LockedAlbumRepository } from 'src/repositories/locked-album.repository.js';
import { requireElevatedPermission } from 'src/utils/access.js';

@Injectable()
export class LockedAlbumService {
  constructor(private repository: LockedAlbumRepository) {}

  private requireSession(auth: AuthDto): string {
    if (auth.apiKey || auth.sharedLink || !auth.session) {
      throw new UnauthorizedException('An elevated session is required');
    }
    requireElevatedPermission(auth);
    return auth.user.id;
  }

  async getAll(auth: AuthDto): Promise<LockedAlbumResponseDto[]> {
    const ownerId = this.requireSession(auth);
    const albums = await this.repository.getAll(ownerId);
    return albums.map((album) => mapLockedAlbum(album));
  }

  async create(auth: AuthDto, dto: CreateLockedAlbumDto): Promise<LockedAlbumResponseDto> {
    const ownerId = this.requireSession(auth);
    return mapLockedAlbum(await this.repository.create(ownerId, dto.albumName));
  }

  async get(auth: AuthDto, id: string): Promise<LockedAlbumResponseDto> {
    const ownerId = this.requireSession(auth);
    const album = await this.repository.get(ownerId, id);
    if (!album) {
      throw new NotFoundException('Locked album not found');
    }
    return mapLockedAlbum(album);
  }

  async update(auth: AuthDto, id: string, dto: UpdateLockedAlbumDto): Promise<LockedAlbumResponseDto> {
    const ownerId = this.requireSession(auth);
    const album = await this.repository.update(ownerId, id, dto.albumName);
    if (!album) {
      throw new NotFoundException('Locked album not found');
    }
    return mapLockedAlbum(album);
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    const ownerId = this.requireSession(auth);
    if (!(await this.repository.delete(ownerId, id))) {
      throw new NotFoundException('Locked album not found');
    }
  }

  async getAssets(auth: AuthDto, id: string, dto: GetLockedAlbumAssetsDto): Promise<LockedAlbumAssetsResponseDto> {
    const ownerId = this.requireSession(auth);
    if (!(await this.repository.get(ownerId, id))) {
      throw new NotFoundException('Locked album not found');
    }
    return this.repository.getAssetIds(ownerId, id, dto);
  }

  async addAssets(auth: AuthDto, id: string, dto: LockedAlbumAssetsDto): Promise<void> {
    const ownerId = this.requireSession(auth);
    await this.repository.addAssets(ownerId, id, dto.ids);
  }

  async removeAssets(auth: AuthDto, id: string, dto: LockedAlbumAssetsDto): Promise<void> {
    const ownerId = this.requireSession(auth);
    await this.repository.removeAssets(ownerId, id, dto.ids);
  }
}
