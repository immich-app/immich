import { UserEntity } from '@app/database/entities/user.entity';
import { BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

export interface IUserRepository {
  get(userId: string): Promise<UserEntity | null>;
  getByEmail(email: string): Promise<UserEntity | null>;
  getList(filter?: { excludeId?: string }): Promise<UserEntity[]>;
  create(createUserDto: CreateUserDto): Promise<UserEntity>;
  update(user: UserEntity, updateUserDto: UpdateUserDto): Promise<UserEntity>;
  createProfileImage(user: UserEntity, fileInfo: Express.Multer.File): Promise<UserEntity>;
}

export const USER_REPOSITORY = 'USER_REPOSITORY';

export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  private async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }

  async get(userId: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async getByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  // TODO add DTO for filtering
  async getList({ excludeId }: { excludeId?: string } = {}): Promise<UserEntity[]> {
    if (!excludeId) {
      return this.userRepository.find(); // TODO: this should also be ordered the same as below
    }

    return this.userRepository.find({
      where: { id: Not(excludeId) },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const newUser = new UserEntity();
    newUser.email = createUserDto.email;
    newUser.salt = await bcrypt.genSalt();
    newUser.password = await this.hashPassword(createUserDto.password, newUser.salt);
    newUser.firstName = createUserDto.firstName;
    newUser.lastName = createUserDto.lastName;
    newUser.isAdmin = false;

    return this.userRepository.save(newUser);
  }

  async update(user: UserEntity, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    user.lastName = updateUserDto.lastName || user.lastName;
    user.firstName = updateUserDto.firstName || user.firstName;
    user.profileImagePath = updateUserDto.profileImagePath || user.profileImagePath;
    user.shouldChangePassword =
      updateUserDto.shouldChangePassword != undefined ? updateUserDto.shouldChangePassword : user.shouldChangePassword;

    // If payload includes password - Create new password for user
    if (updateUserDto.password) {
      user.salt = await bcrypt.genSalt();
      user.password = await this.hashPassword(updateUserDto.password, user.salt);
    }

    // TODO: can this happen? If so we can move it to the service, otherwise remove it (also from DTO)
    if (updateUserDto.isAdmin) {
      const adminUser = await this.userRepository.findOne({ where: { isAdmin: true } });

      if (adminUser) {
        throw new BadRequestException('Admin user exists');
      }

      user.isAdmin = true;
    }

    return this.userRepository.save(user);
  }

  async createProfileImage(user: UserEntity, fileInfo: Express.Multer.File): Promise<UserEntity> {
    user.profileImagePath = fileInfo.path;
    return this.userRepository.save(user);
  }
}
