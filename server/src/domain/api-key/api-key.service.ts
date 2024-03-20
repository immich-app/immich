import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { APIKeyCreateDto, APIKeyCreateResponseDto, APIKeyResponseDto } from 'src/domain/api-key/api-key.dto';
import { AuthDto } from 'src/domain/auth/auth.dto';
import { IKeyRepository } from 'src/domain/repositories/api-key.repository';
import { ICryptoRepository } from 'src/domain/repositories/crypto.repository';
import { APIKeyEntity } from 'src/infra/entities/api-key.entity';

@Injectable()
export class APIKeyService {
  constructor(
    @Inject(ICryptoRepository) private crypto: ICryptoRepository,
    @Inject(IKeyRepository) private repository: IKeyRepository,
  ) {}

  async create(auth: AuthDto, dto: APIKeyCreateDto): Promise<APIKeyCreateResponseDto> {
    const secret = this.crypto.randomBytes(32).toString('base64').replaceAll(/\W/g, '');
    const entity = await this.repository.create({
      key: this.crypto.hashSha256(secret),
      name: dto.name || 'API Key',
      userId: auth.user.id,
    });

    return { secret, apiKey: this.map(entity) };
  }

  async update(auth: AuthDto, id: string, dto: APIKeyCreateDto): Promise<APIKeyResponseDto> {
    const exists = await this.repository.getById(auth.user.id, id);
    if (!exists) {
      throw new BadRequestException('API Key not found');
    }

    const key = await this.repository.update(auth.user.id, id, { name: dto.name });

    return this.map(key);
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    const exists = await this.repository.getById(auth.user.id, id);
    if (!exists) {
      throw new BadRequestException('API Key not found');
    }

    await this.repository.delete(auth.user.id, id);
  }

  async getById(auth: AuthDto, id: string): Promise<APIKeyResponseDto> {
    const key = await this.repository.getById(auth.user.id, id);
    if (!key) {
      throw new BadRequestException('API Key not found');
    }
    return this.map(key);
  }

  async getAll(auth: AuthDto): Promise<APIKeyResponseDto[]> {
    const keys = await this.repository.getByUserId(auth.user.id);
    return keys.map((key) => this.map(key));
  }

  private map(entity: APIKeyEntity): APIKeyResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
