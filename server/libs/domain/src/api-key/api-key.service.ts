import { UserEntity } from '@app/infra/db/entities';
import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
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
    const key = this.crypto.randomBytes(24).toString('base64').replace(/\W/g, '');
    const entity = await this.repository.create({
      key: await this.crypto.hash(key, 10),
      name: dto.name || 'API Key',
      userId: authUser.id,
    });

    const secret = Buffer.from(`${entity.id}:${key}`, 'utf8').toString('base64');

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

  async validate(token: string): Promise<AuthUserDto> {
    const [_id, key] = Buffer.from(token, 'base64').toString('utf8').split(':');
    const id = Number(_id);

    if (id && key) {
      const entity = await this.repository.getKey(id);
      if (entity?.user && entity?.key && this.crypto.compareSync(key, entity.key)) {
        const user = entity.user as UserEntity;

        return {
          id: user.id,
          email: user.email,
          isAdmin: user.isAdmin,
          isPublicUser: false,
          isAllowUpload: true,
        };
      }
    }

    throw new UnauthorizedException('Invalid API Key');
  }
}
