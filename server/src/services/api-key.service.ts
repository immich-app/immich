import { BadRequestException, Injectable } from '@nestjs/common';
import { APIKeyCreateDto, APIKeyCreateResponseDto, APIKeyResponseDto, APIKeyUpdateDto } from 'src/dtos/api-key.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { APIKeyEntity } from 'src/entities/api-key.entity';
import { BaseService } from 'src/services/base.service';
import { isGranted } from 'src/utils/access';

@Injectable()
export class APIKeyService extends BaseService {
  async create(auth: AuthDto, dto: APIKeyCreateDto): Promise<APIKeyCreateResponseDto> {
    const secret = this.cryptoRepository.newPassword(32);

    if (auth.apiKey && !isGranted({ requested: dto.permissions, current: auth.apiKey.permissions })) {
      throw new BadRequestException('Cannot grant permissions you do not have');
    }

    const entity = await this.keyRepository.create({
      key: this.cryptoRepository.hashSha256(secret),
      name: dto.name || 'API Key',
      userId: auth.user.id,
      permissions: dto.permissions,
    });

    return { secret, apiKey: this.map(entity) };
  }

  async update(auth: AuthDto, id: string, dto: APIKeyUpdateDto): Promise<APIKeyResponseDto> {
    const exists = await this.keyRepository.getById(auth.user.id, id);
    if (!exists) {
      throw new BadRequestException('API Key not found');
    }

    const key = await this.keyRepository.update(auth.user.id, id, { name: dto.name });

    return this.map(key);
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    const exists = await this.keyRepository.getById(auth.user.id, id);
    if (!exists) {
      throw new BadRequestException('API Key not found');
    }

    await this.keyRepository.delete(auth.user.id, id);
  }

  async getById(auth: AuthDto, id: string): Promise<APIKeyResponseDto> {
    const key = await this.keyRepository.getById(auth.user.id, id);
    if (!key) {
      throw new BadRequestException('API Key not found');
    }
    return this.map(key);
  }

  async getAll(auth: AuthDto): Promise<APIKeyResponseDto[]> {
    const keys = await this.keyRepository.getByUserId(auth.user.id);
    return keys.map((key) => this.map(key));
  }

  private map(entity: APIKeyEntity): APIKeyResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      permissions: entity.permissions,
    };
  }
}
