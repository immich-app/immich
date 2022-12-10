import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ValidationPipe,
  Put,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseBoolPipe,
  BadRequestException,
  Header,
  StreamableFile,
} from '@nestjs/common';
import { UserService } from '@app/common';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { profileImageUploadOption } from '../../config/profile-image-upload.config';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { mapUser, UserResponseDto } from './response-dto/user-response.dto';
import { mapUserCountResponse, UserCountResponseDto } from './response-dto/user-count-response.dto';
import { CreateProfileImageDto } from './dto/create-profile-image.dto';
import {
  CreateProfileImageResponseDto,
  mapCreateProfileImageResponse,
} from './response-dto/create-profile-image-response.dto';
import { createReadStream } from 'fs';
import { UserCountDto } from './dto/user-count.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Authenticated()
  @ApiBearerAuth()
  @Get()
  public async getAllUsers(
    @GetAuthUser() authUser: AuthUserDto,
    @Query('isAll', ParseBoolPipe) isAll: boolean,
  ): Promise<UserResponseDto[]> {
    const users = await this.service.getAllUsers(authUser.id, isAll);
    return users.map(mapUser);
  }

  @Get('/info/:userId')
  public async getUserById(@Param('userId') userId: string): Promise<UserResponseDto> {
    const user = await this.service.getUserById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return mapUser(user);
  }

  @Authenticated()
  @ApiBearerAuth()
  @Get('me')
  public async getMyUserInfo(@GetAuthUser() authUser: AuthUserDto): Promise<UserResponseDto> {
    return this.getUserById(authUser.id);
  }

  @Authenticated({ admin: true })
  @ApiBearerAuth()
  @Post()
  public async createUser(@Body(new ValidationPipe({ transform: true })) dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.service.create(dto);
    return mapUser(user);
  }

  @Get('/count')
  public async getUserCount(
    @Query(new ValidationPipe({ transform: true })) dto: UserCountDto,
  ): Promise<UserCountResponseDto> {
    const count = await this.service.getUserCount(dto);
    return mapUserCountResponse(count);
  }

  @Authenticated({ admin: true })
  @ApiBearerAuth()
  @Delete('/:userId')
  public async deleteUser(
    @GetAuthUser() authUser: AuthUserDto,
    @Param('userId') userId: string,
  ): Promise<UserResponseDto> {
    const user = await this.service.remove(authUser.id, userId);
    return mapUser(user);
  }

  @Authenticated({ admin: true })
  @ApiBearerAuth()
  @Post('/:userId/restore')
  public async restoreUser(
    @GetAuthUser() authUser: AuthUserDto,
    @Param('userId') userId: string,
  ): Promise<UserResponseDto> {
    const user = await this.service.restore(authUser.id, userId);
    return mapUser(user);
  }

  // TODO: refactor to @Put(':userId')
  @Authenticated()
  @ApiBearerAuth()
  @Put()
  public async updateUser(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.service.update(authUser.id, dto);
    return mapUser(user);
  }

  @UseInterceptors(FileInterceptor('file', profileImageUploadOption))
  @Authenticated()
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'A new avatar for the user',
    type: CreateProfileImageDto,
  })
  @Post('/profile-image')
  public async createProfileImage(
    @GetAuthUser() authUser: AuthUserDto,
    @UploadedFile() fileInfo: Express.Multer.File,
  ): Promise<CreateProfileImageResponseDto> {
    await this.service.update(authUser.id, {
      id: authUser.id,
      profileImagePath: fileInfo.path,
    });
    return mapCreateProfileImageResponse(authUser.id, fileInfo.path);
  }

  @Get('/profile-image/:userId')
  @Header('Content-Type', 'image/jpeg')
  public async getProfileImage(@Param('userId') userId: string): Promise<StreamableFile> {
    const user = await this.service.getUserById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.profileImagePath) {
      throw new BadRequestException('User does not have a profile image');
    }

    try {
      return new StreamableFile(createReadStream(user.profileImagePath));
    } catch (e) {
      throw new BadRequestException('User does not have a profile image');
    }
  }
}
