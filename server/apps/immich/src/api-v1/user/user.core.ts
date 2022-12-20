import { UserEntity } from '@app/database/entities/user.entity';
import { BadRequestException, ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { genSalt, hash } from 'bcrypt';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { CreateAdminDto, CreateUserDto, CreateUserOauthDto } from './dto/create-user.dto';
import { IUserRepository } from './user-repository';

export class UserCore {
  constructor(private userRepository: IUserRepository) {}

  private async generateSalt(): Promise<string> {
    return genSalt();
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    return hash(password, salt);
  }

  async updateUser(authUser: AuthUserDto, user: UserEntity, update: Partial<UserEntity>): Promise<UserEntity> {
    if (!authUser.isAdmin && (authUser.id !== user.id || user.id != update.id)) {
      throw new ForbiddenException('You are not allowed to update this user');
    }

    try {
      const payload: Partial<UserEntity> = { ...update };
      if (payload.password) {
        const salt = await this.generateSalt();
        payload.salt = salt;
        payload.password = await this.hashPassword(payload.password, salt);
      }
      return this.userRepository.update(user.id, payload);
    } catch (e) {
      Logger.error(e, 'Failed to update user info');
      throw new InternalServerErrorException('Failed to update user info');
    }
  }

  async createUser(createUserDto: CreateUserDto | CreateAdminDto | CreateUserOauthDto): Promise<UserEntity> {
    const user = await this.userRepository.getByEmail(createUserDto.email);
    if (user) {
      throw new BadRequestException('User exists');
    }

    if (!(createUserDto as CreateAdminDto).isAdmin) {
      const localAdmin = await this.userRepository.getAdmin();
      if (!localAdmin) {
        throw new BadRequestException('The first registered account must the administrator.');
      }
    }

    try {
      const payload: Partial<UserEntity> = { ...createUserDto };
      if (payload.password) {
        const salt = await this.generateSalt();
        payload.salt = salt;
        payload.password = await this.hashPassword(payload.password, salt);
      }
      return this.userRepository.create(payload);
    } catch (e) {
      Logger.error(e, 'Create new user');
      throw new InternalServerErrorException('Failed to register new user');
    }
  }

  public async get(userId: string, withDeleted?: boolean): Promise<UserEntity | null> {
    return this.userRepository.get(userId, withDeleted);
  }

  public async getAdmin(): Promise<UserEntity | null> {
    return this.userRepository.getAdmin();
  }

  public async getByEmail(email: string, withPassword?: boolean): Promise<UserEntity | null> {
    return this.userRepository.getByEmail(email, withPassword);
  }

  public async getByOAuthId(oauthId: string): Promise<UserEntity | null> {
    return this.userRepository.getByOAuthId(oauthId);
  }
}
