import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { CreateUserDto, DeleteUserDto, UserResponseDto } from 'src/dtos/user.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { Route } from 'src/middleware/file-upload.interceptor';
import { UserService } from 'src/services/user.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('User')
@Controller(Route.USER)
@Authenticated({ admin: true })
export class UserController {
  constructor(private service: UserService) {}

  @Get()
  getAllUsers(@Query('isAll') isAll: boolean): Promise<UserResponseDto[]> {
    return this.service.getAll(isAll);
  }

  @Get('info/:id')
  getUserById(@Param() { id }: UUIDParamDto): Promise<UserResponseDto> {
    return this.service.get(id);
  }

  @Post()
  createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.service.create(createUserDto);
  }

  @Delete(':id')
  deleteUser(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: DeleteUserDto,
  ): Promise<UserResponseDto> {
    return this.service.delete(auth, id, dto);
  }

  @Post(':id/restore')
  restoreUser(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<UserResponseDto> {
    return this.service.restore(auth, id);
  }
}
