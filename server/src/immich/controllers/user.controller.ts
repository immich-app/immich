import {
  AuthDto,
  CreateUserDto as CreateDto,
  CreateProfileImageDto,
  CreateProfileImageResponseDto,
  UpdateUserDto as UpdateDto,
  UserResponseDto,
  UserService,
} from '@app/domain';
import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AdminRoute, Auth, Authenticated } from '../app.guard';
import { UseValidation, asStreamableFile } from '../app.utils';
import { FileUploadInterceptor, Route } from '../interceptors';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('User')
@Controller(Route.USER)
@Authenticated()
@UseValidation()
export class UserController {
  constructor(private service: UserService) {}

  @Get()
  getAllUsers(@Auth() auth: AuthDto, @Query('isAll') isAll: boolean): Promise<UserResponseDto[]> {
    return this.service.getAll(auth, isAll);
  }

  @Get('info/:id')
  getUserById(@Param() { id }: UUIDParamDto): Promise<UserResponseDto> {
    return this.service.get(id);
  }

  @Get('me')
  getMyUserInfo(@Auth() auth: AuthDto): Promise<UserResponseDto> {
    return this.service.getMe(auth);
  }

  @AdminRoute()
  @Post()
  createUser(@Body() createUserDto: CreateDto): Promise<UserResponseDto> {
    return this.service.create(createUserDto);
  }

  @Delete('profile-image')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteProfileImage(@Auth() auth: AuthDto): Promise<void> {
    return this.service.deleteProfileImage(auth);
  }

  @AdminRoute()
  @Delete(':id')
  deleteUser(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<UserResponseDto> {
    return this.service.delete(auth, id);
  }

  @AdminRoute()
  @Post(':id/restore')
  restoreUser(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<UserResponseDto> {
    return this.service.restore(auth, id);
  }

  // TODO: replace with @Put(':id')
  @Put()
  updateUser(@Auth() auth: AuthDto, @Body() updateUserDto: UpdateDto): Promise<UserResponseDto> {
    return this.service.update(auth, updateUserDto);
  }

  @UseInterceptors(FileUploadInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'A new avatar for the user', type: CreateProfileImageDto })
  @Post('profile-image')
  createProfileImage(
    @Auth() auth: AuthDto,
    @UploadedFile() fileInfo: Express.Multer.File,
  ): Promise<CreateProfileImageResponseDto> {
    return this.service.createProfileImage(auth, fileInfo);
  }

  @Get('profile-image/:id')
  @Header('Cache-Control', 'private, no-cache, no-transform')
  getProfileImage(@Param() { id }: UUIDParamDto): Promise<any> {
    return this.service.getProfileImage(id).then(asStreamableFile);
  }
}
