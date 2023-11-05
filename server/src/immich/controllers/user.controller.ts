import {
  AuthUserDto,
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
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AdminRoute, AuthUser, Authenticated } from '../app.guard';
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
  getAllUsers(@AuthUser() authUser: AuthUserDto, @Query('isAll') isAll: boolean): Promise<UserResponseDto[]> {
    return this.service.getAll(authUser, isAll);
  }

  @Get('info/:id')
  getUserById(@Param() { id }: UUIDParamDto): Promise<UserResponseDto> {
    return this.service.get(id);
  }

  @Get('me')
  getMyUserInfo(@AuthUser() authUser: AuthUserDto): Promise<UserResponseDto> {
    return this.service.getMe(authUser);
  }

  @AdminRoute()
  @Post()
  createUser(@Body() createUserDto: CreateDto): Promise<UserResponseDto> {
    return this.service.create(createUserDto);
  }

  @AdminRoute()
  @Delete(':id')
  deleteUser(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<UserResponseDto> {
    return this.service.delete(authUser, id);
  }

  @AdminRoute()
  @Post(':id/restore')
  restoreUser(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<UserResponseDto> {
    return this.service.restore(authUser, id);
  }

  // TODO: replace with @Put(':id')
  @Put()
  updateUser(@AuthUser() authUser: AuthUserDto, @Body() updateUserDto: UpdateDto): Promise<UserResponseDto> {
    return this.service.update(authUser, updateUserDto);
  }

  @UseInterceptors(FileUploadInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'A new avatar for the user', type: CreateProfileImageDto })
  @Post('profile-image')
  createProfileImage(
    @AuthUser() authUser: AuthUserDto,
    @UploadedFile() fileInfo: Express.Multer.File,
  ): Promise<CreateProfileImageResponseDto> {
    return this.service.createProfileImage(authUser, fileInfo);
  }

  @Get('profile-image/:id')
  @Header('Cache-Control', 'private, no-cache, no-transform')
  getProfileImage(@Param() { id }: UUIDParamDto): Promise<any> {
    return this.service.getProfileImage(id).then(asStreamableFile);
  }
}
