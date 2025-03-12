import { BadRequestException, Injectable } from '@nestjs/common';
import { APIKeyCreateDto, APIKeyCreateResponseDto, APIKeyResponseDto, APIKeyUpdateDto } from 'src/dtos/api-key.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { Permission } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { ApiKeyItem } from 'src/types';
import { isGranted } from 'src/utils/access';

@Injectable()
export class ApiKeyService extends BaseService {
  async create(auth: AuthDto, dto: APIKeyCreateDto): Promise<APIKeyCreateResponseDto> {
    const secret = this.cryptoRepository.newPassword(32);

    if (auth.apiKey && !isGranted({ requested: dto.permissions, current: auth.apiKey.permissions })) {
      throw new BadRequestException('Cannot grant permissions you do not have');
    }

    const entity = await this.apiKeyRepository.create({
      key: this.cryptoRepository.hashSha256(secret),
      name: dto.name || 'API Key',
      userId: auth.user.id,
      permissions: dto.permissions,
    });

    return { secret, apiKey: this.map(entity) };
  }

  async update(auth: AuthDto, id: string, dto: APIKeyUpdateDto): Promise<APIKeyResponseDto> {
    const exists = await this.apiKeyRepository.getById(auth.user.id, id);
    if (!exists) {
      throw new BadRequestException('API Key not found');
    }

    const key = await this.apiKeyRepository.update(auth.user.id, id, { name: dto.name });

    return this.map(key);
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    const exists = await this.apiKeyRepository.getById(auth.user.id, id);
    if (!exists) {
      throw new BadRequestException('API Key not found');
    }

    await this.apiKeyRepository.delete(auth.user.id, id);
  }

  async getById(auth: AuthDto, id: string): Promise<APIKeyResponseDto> {
    const key = await this.apiKeyRepository.getById(auth.user.id, id);
    if (!key) {
      throw new BadRequestException('API Key not found');
    }
    return this.map(key);
  }

  async getAll(auth: AuthDto): Promise<APIKeyResponseDto[]> {
    const keys = await this.apiKeyRepository.getByUserId(auth.user.id);
    return keys.map((key) => this.map(key));
  }

  private map(entity: ApiKeyItem): APIKeyResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      permissions: entity.permissions as Permission[],
    };
  }
}
