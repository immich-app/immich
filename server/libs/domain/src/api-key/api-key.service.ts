import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AuthUserDto, ICryptoRepository } from '../auth';
import { IKeyRepository } from './api-key.repository';
import { APIKeyCreateDto } from './dto/api-key-create.dto';
import { APIKeyCreateResponseDto } from './response-dto/api-key-create-response.dto';
import { APIKeyResponseDto, mapKey } from './response-dto/api-key-response.dto';

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

  async update(authUser: AuthUserDto, id: number, dto: APIKeyCreateDto): Promise<APIKeyResponseDto> {
    const exists = await this.repository.getById(authUser.id, id);
    if (!exists) {
      throw new BadRequestException('API Key not found');
    }

    return this.repository.update(authUser.id, id, {
      name: dto.name,
    });
  }

  async delete(authUser: AuthUserDto, id: number): Promise<void> {
    const exists = await this.repository.getById(authUser.id, id);
    if (!exists) {
      throw new BadRequestException('API Key not found');
    }

    await this.repository.delete(authUser.id, id);
  }

  async getById(authUser: AuthUserDto, id: number): Promise<APIKeyResponseDto> {
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

  async validate(token: string): Promise<AuthUserDto | null> {
    const hashedToken = this.crypto.hashSha256(token);
    const keyEntity = await this.repository.getKey(hashedToken);
    if (keyEntity?.user) {
      const user = keyEntity.user;

      return {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        isPublicUser: false,
        isAllowUpload: true,
      };
    }

    return null;
  }
}
