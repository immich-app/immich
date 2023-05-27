import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AuthUserDto } from '../auth';
import { ICryptoRepository } from '../crypto';
import { APIKeyCreateResponseDto, APIKeyResponseDto, mapKey } from './api-key-response.dto';
import { APIKeyCreateDto } from './api-key.dto';
import { IKeyRepository } from './api-key.repository';

@Injectable()
export class APIKeyService {
  constructor(
    @Inject(ICryptoRepository) private crypto: ICryptoRepository,
    @Inject(IKeyRepository) private repository: IKeyRepository,
  ) {}

  async create(authUser: AuthUserDto, dto: APIKeyCreateDto): Promise<APIKeyCreateResponseDto> {
    const secret = this.crypto.randomBytes(32).toString('base64').replace(/\W/g, '');
    const entity = await this.repository.create({
      key: this.crypto.hashSha256(secret),
      name: dto.name || 'API Key',
      userId: authUser.id,
    });

    return { secret, apiKey: mapKey(entity) };
  }

  async update(authUser: AuthUserDto, id: string, dto: APIKeyCreateDto): Promise<APIKeyResponseDto> {
    const exists = await this.repository.getById(authUser.id, id);
    if (!exists) {
      throw new BadRequestException('API Key not found');
    }

    return this.repository.update(authUser.id, id, {
      name: dto.name,
    });
  }

  async delete(authUser: AuthUserDto, id: string): Promise<void> {
    const exists = await this.repository.getById(authUser.id, id);
    if (!exists) {
      throw new BadRequestException('API Key not found');
    }

    await this.repository.delete(authUser.id, id);
  }

  async getById(authUser: AuthUserDto, id: string): Promise<APIKeyResponseDto> {
    const key = await this.repository.getById(authUser.id, id);
    if (!key) {
      throw new BadRequestException('API Key not found');
    }
    return mapKey(key);
  }

  async getAll(authUser: AuthUserDto): Promise<APIKeyResponseDto[]> {
    const keys = await this.repository.getByUserId(authUser.id);
    return keys.map(mapKey);
  }
}
