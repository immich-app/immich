import { BadRequestException, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../models';

export type UserCreateDto = Pick<User, 'email'> & Partial<User>;
export type UserUpdateDto = Pick<User, 'id'> & Partial<User>;
export interface UserCountDto {
  admin?: boolean;
}

export interface IUserRepository {
  get(id: string, withDeleted?: boolean): Promise<User | null>;
  getAdmin(): Promise<User | null>;
  getByEmail(email: string, withPassword?: boolean): Promise<User | null>;
  getByOAuthId(oauthId: string): Promise<User | null>;
  getList(filter?: { excludeId?: string }): Promise<User[]>;
  create(dt: UserCreateDto): Promise<User>;
  update(dto: UserUpdateDto): Promise<User>;
  remove(user: User): Promise<User>;
  restore(user: User): Promise<User>;
}

export const IUserRepository = 'IUserRepository';

@Injectable()
export class UserService {
  constructor(@Inject(IUserRepository) private repository: IUserRepository) {}

  public async getAllUsers(userId: string, isAll: boolean): Promise<User[]> {
    if (isAll) {
      return this.repository.getList();
    }

    return this.repository.getList({ excludeId: userId });
  }

  public async getUserById(userId: string, withDeleted = false): Promise<User | null> {
    return this.repository.get(userId, withDeleted);
  }

  public async getUserCount(dto: UserCountDto): Promise<number> {
    let users = await this.repository.getList();
    if (dto.admin) {
      users = users.filter((user) => user.isAdmin);
    }

    return users.length;
  }

  public async getAdmin(): Promise<User | null> {
    return this.repository.getAdmin();
  }

  public async create(dto: UserCreateDto): Promise<User> {
    const localAdmin = await this.getAdmin();
    if (!localAdmin && !dto.isAdmin) {
      throw new BadRequestException('The first registered account must the administrator.');
    }

    const user = await this.repository.getByEmail(dto.email);
    if (user) {
      throw new BadRequestException('User exists');
    }

    await this.updatePasswordCheck(dto);

    return this.repository.create(dto);
  }

  public async update(requestorId: string, dto: UserUpdateDto): Promise<User> {
    const requestor = await this.repository.get(requestorId);
    if (!requestor) {
      throw new UnauthorizedException('Requestor not found');
    }

    if (!requestor.isAdmin && requestor.id !== dto.id) {
      throw new ForbiddenException('Must be an admin to update another account');
    }

    const user = await this.repository.get(dto.id);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.isAdmin && dto.isAdmin) {
      const adminUser = await this.repository.getAdmin();
      if (adminUser) {
        throw new BadRequestException('Admin user exists');
      }

      user.isAdmin = true;
    }

    user.firstName = dto.firstName ?? user.firstName;
    user.lastName = dto.lastName ?? user.lastName;
    user.email = dto.email ?? user.email;
    user.oauthId = dto.oauthId ?? user.oauthId;
    user.profileImagePath = dto.profileImagePath ?? user.profileImagePath;
    user.shouldChangePassword = dto.shouldChangePassword ?? user.shouldChangePassword;

    await this.updatePasswordCheck(dto);

    return this.repository.update(user);
  }

  async remove(requestorId: string, userId: string): Promise<User> {
    const requestor = await this.repository.get(requestorId);
    if (!requestor) {
      throw new UnauthorizedException('Requestor not found');
    }

    if (!requestor.isAdmin) {
      throw new ForbiddenException('Must be an admin to remove an account');
    }

    const user = await this.repository.get(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isAdmin) {
      throw new BadRequestException('Cannot remove the admin account');
    }

    return this.repository.remove(user);
  }

  async restore(requestorId: string, userId: string): Promise<User> {
    const requestor = await this.repository.get(requestorId);
    if (!requestor) {
      throw new UnauthorizedException('Requestor not found');
    }

    if (!requestor.isAdmin) {
      throw new ForbiddenException('Must be an admin to restore an account');
    }

    const user = await this.repository.get(userId, true);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.repository.restore(user);
  }

  private async updatePasswordCheck(dto: Partial<User>) {
    if (dto.password) {
      dto.salt = await bcrypt.genSalt();
      dto.password = await bcrypt.hash(dto.password, dto.salt);
      dto.shouldChangePassword = false;
    }
  }
}
