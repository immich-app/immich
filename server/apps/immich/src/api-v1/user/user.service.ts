import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { createReadStream } from 'fs';
import { Response as Res } from 'express';
import { mapUser, UserResponseDto } from './response-dto/user-response.dto';
import { mapUserCountResponse, UserCountResponseDto } from './response-dto/user-count-response.dto';
import {
  CreateProfileImageResponseDto,
  mapCreateProfileImageResponse,
} from './response-dto/create-profile-image-response.dto';
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

  async getUserById(userId: string): Promise<UserResponseDto> {
    console.log(userId);
    const user = await this.userRepository.get(userId);
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

  async updateUser(updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.get(updateUserDto.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    try {
      const updatedUser = await this.userRepository.update(user, updateUserDto);

      return mapUser(updatedUser);
    } catch (e) {
      Logger.error(e, 'Create new user');
      throw new InternalServerErrorException('Failed to register new user');
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
      await this.userRepository.createProfileImage(user, fileInfo);

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
