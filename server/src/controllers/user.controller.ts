import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { CreateUserDto, DeleteUserDto, UpdateUserDto, UserResponseDto } from 'src/dtos/user.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { UserService } from 'src/services/user.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Users')
@Controller('users')
@Authenticated({ admin: true })
export class UserController {
  constructor(private service: UserService) {}

  @Get()
  getAllUsers(@Query('isAll') isAll: boolean): Promise<UserResponseDto[]> {
    return this.service.getAll(isAll);
  }

  @Post()
  createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.service.create(createUserDto);
  }

  @Get(':id')
  getUser(@Param() { id }: UUIDParamDto): Promise<UserResponseDto> {
    return this.service.get(id);
  }

  @Put(':id')
  updateUser(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto, @Body() dto: UpdateUserDto) {
    return this.service.update(auth, id, dto);
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
