import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ApiKey } from 'src/database';
import { ApiKeyCreateDto, ApiKeyCreateResponseDto, ApiKeyResponseDto, ApiKeyUpdateDto } from 'src/dtos/api-key.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { Permission } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { isGranted } from 'src/utils/access';
import { findOrFail } from 'src/utils/misc';

@Injectable()
export class ApiKeyService extends BaseService {
  async create(auth: AuthDto, dto: ApiKeyCreateDto): Promise<ApiKeyCreateResponseDto> {
    const token = this.cryptoRepository.randomBytesAsText(32);
    const hashed = this.cryptoRepository.hashSha256(token);

    if (auth.apiKey && !isGranted({ requested: dto.permissions, current: auth.apiKey.permissions })) {
      throw new BadRequestException('Cannot grant permissions you do not have');
    }

    const entity = await this.apiKeyRepository.create({
      key: hashed,
      name: dto.name || 'API Key',
      userId: auth.user.id,
      permissions: dto.permissions,
    });
    const apiKey = this.map(entity);

    return { ...apiKey, secret: token, apiKey };
  }

  async update(auth: AuthDto, id: string, dto: ApiKeyUpdateDto): Promise<ApiKeyResponseDto> {
    const exists = await this.apiKeyRepository.getById(auth.user.id, id);
    if (!exists) {
      throw new BadRequestException('API Key not found');
    }

    if (
      auth.apiKey &&
      dto.permissions &&
      !isGranted({ requested: dto.permissions, current: auth.apiKey.permissions })
    ) {
      throw new BadRequestException('Cannot grant permissions you do not have');
    }

    const key = await this.apiKeyRepository.update(auth.user.id, id, { name: dto.name, permissions: dto.permissions });

    return this.map(key);
  }

  async rotate(auth: AuthDto, id: string): Promise<ApiKeyCreateResponseDto> {
    const existing = await findOrFail(() => this.apiKeyRepository.getById(auth.user.id, id), 'API Key not found');

    if (
      auth.apiKey &&
      !isGranted({ requested: existing.permissions as Permission[], current: auth.apiKey.permissions })
    ) {
      throw new BadRequestException('Cannot rotate an API Key with permissions you do not have');
    }

    const token = this.cryptoRepository.randomBytesAsText(32);
    const hashed = this.cryptoRepository.hashSha256(token);
    const newKey = await this.apiKeyRepository.update(auth.user.id, id, { key: hashed });
    const apiKey = this.map(newKey);

    return { ...apiKey, secret: token, apiKey };
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    const exists = await this.apiKeyRepository.getById(auth.user.id, id);
    if (!exists) {
      throw new BadRequestException('API Key not found');
    }

    await this.apiKeyRepository.delete(auth.user.id, id);
  }

  async getMine(auth: AuthDto): Promise<ApiKeyResponseDto> {
    if (!auth.apiKey) {
      throw new ForbiddenException('Not authenticated with an API Key');
    }

    const key = await this.apiKeyRepository.getById(auth.user.id, auth.apiKey.id);
    if (!key) {
      throw new BadRequestException('API Key not found');
    }

    return this.map(key);
  }

  async getById(auth: AuthDto, id: string): Promise<ApiKeyResponseDto> {
    const key = await this.apiKeyRepository.getById(auth.user.id, id);
    if (!key) {
      throw new BadRequestException('API Key not found');
    }
    return this.map(key);
  }

  async getAll(auth: AuthDto): Promise<ApiKeyResponseDto[]> {
    const keys = await this.apiKeyRepository.getByUserId(auth.user.id);
    return keys.map((key) => this.map(key));
  }

  private map(entity: ApiKey): ApiKeyResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      permissions: entity.permissions as Permission[],
    };
  }
}
