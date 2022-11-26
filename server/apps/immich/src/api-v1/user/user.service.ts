import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  StreamableFile,
  UnauthorizedException,
} from '@nestjs/common';
import { Response as Res } from 'express';
import { createReadStream } from 'fs';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  CreateProfileImageResponseDto,
  mapCreateProfileImageResponse,
} from './response-dto/create-profile-image-response.dto';
import { mapUserCountResponse, UserCountResponseDto } from './response-dto/user-count-response.dto';
import { mapUser, UserResponseDto } from './response-dto/user-response.dto';
import { IUserRepository, USER_REPOSITORY } from './user-repository';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private userRepository: IUserRepository,
  ) {}

  async getAllUsers(authUser: AuthUserDto, isAll: boolean): Promise<UserResponseDto[]> {
    if (isAll) {
      const allUsers = await this.userRepository.getList();
      return allUsers.map(mapUser);
    }

    const allUserExceptRequestedUser = await this.userRepository.getList({ excludeId: authUser.id });

    return allUserExceptRequestedUser.map(mapUser);
  }

  async getUserById(userId: string, withDeleted = false): Promise<UserResponseDto> {
    const user = await this.userRepository.get(userId, withDeleted);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return mapUser(user);
  }

  async getUserInfo(authUser: AuthUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.get(authUser.id);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return mapUser(user);
  }

  async getUserCount(): Promise<UserCountResponseDto> {
    const users = await this.userRepository.getList();

    return mapUserCountResponse(users.length);
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.getByEmail(createUserDto.email);

    if (user) {
      throw new BadRequestException('User exists');
    }

    try {
      const savedUser = await this.userRepository.create(createUserDto);

      return mapUser(savedUser);
    } catch (e) {
      Logger.error(e, 'Create new user');
      throw new InternalServerErrorException('Failed to register new user');
    }
  }

  async updateUser(authUser: AuthUserDto, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const requestor = await this.userRepository.get(authUser.id);

    if (!requestor) {
      throw new NotFoundException('Requestor not found');
    }

    if (!requestor.isAdmin) {
      if (requestor.id !== updateUserDto.id) {
        throw new BadRequestException('Unauthorized');
      }
    }

    const user = await this.userRepository.get(updateUserDto.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    try {
      const updatedUser = await this.userRepository.update(user.id, updateUserDto);

      return mapUser(updatedUser);
    } catch (e) {
      Logger.error(e, 'Failed to update user info');
      throw new InternalServerErrorException('Failed to update user info');
    }
  }

  async deleteUser(authUser: AuthUserDto, userId: string): Promise<UserResponseDto> {
    const requestor = await this.userRepository.get(authUser.id);
    if (!requestor) {
      throw new UnauthorizedException('Requestor not found');
    }
    if (!requestor.isAdmin) {
      throw new ForbiddenException('Unauthorized');
    }
    const user = await this.userRepository.get(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isAdmin) {
      throw new BadRequestException('Cannot delete admin user');
    }

    try {
      const deletedUser = await this.userRepository.delete(user);
      return mapUser(deletedUser);
    } catch (e) {
      Logger.error(e, 'Failed to delete user');
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  async restoreUser(authUser: AuthUserDto, userId: string): Promise<UserResponseDto> {
    const requestor = await this.userRepository.get(authUser.id);
    if (!requestor) {
      throw new UnauthorizedException('Requestor not found');
    }
    if (!requestor.isAdmin) {
      throw new ForbiddenException('Unauthorized');
    }
    const user = await this.userRepository.get(userId, true);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    try {
      const restoredUser = await this.userRepository.restore(user);
      return mapUser(restoredUser);
    } catch (e) {
      Logger.error(e, 'Failed to restore deleted user');
      throw new InternalServerErrorException('Failed to restore deleted user');
    }
  }

  async createProfileImage(
    authUser: AuthUserDto,
    fileInfo: Express.Multer.File,
  ): Promise<CreateProfileImageResponseDto> {
    const user = await this.userRepository.get(authUser.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      await this.userRepository.update(user.id, { profileImagePath: fileInfo.path });

      return mapCreateProfileImageResponse(authUser.id, fileInfo.path);
    } catch (e) {
      Logger.error(e, 'Create User Profile Image');
      throw new InternalServerErrorException('Failed to create new user profile image');
    }
  }

  async getUserProfileImage(userId: string, res: Res) {
    try {
      const user = await this.userRepository.get(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.profileImagePath) {
        throw new NotFoundException('User does not have a profile image');
      }

      res.set({
        'Content-Type': 'image/jpeg',
      });
      const fileStream = createReadStream(user.profileImagePath);
      return new StreamableFile(fileStream);
    } catch (e) {
      throw new NotFoundException('User does not have a profile image');
    }
  }
}
