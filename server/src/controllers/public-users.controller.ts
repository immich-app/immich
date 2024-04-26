import { Controller, Get, Next, Param, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NextFunction, Response } from 'express';
import { UserDto } from 'src/dtos/user.dto';
import { Authenticated, FileResponse } from 'src/middleware/auth.guard';
import { PublicUserService } from 'src/services/public-user.service';
import { sendFile } from 'src/utils/file';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Public Users')
@Controller('public-users')
@Authenticated()
export class PublicUsersController {
  constructor(private service: PublicUserService) {}

  @Get()
  getPublicUsers(): Promise<UserDto[]> {
    return this.service.getAll();
  }

  @Get(':id')
  getPublicUser(@Param() { id }: UUIDParamDto): Promise<UserDto> {
    return this.service.get(id);
  }

  @Get(':id/profile-image')
  @FileResponse()
  async getProfileImage(@Res() res: Response, @Next() next: NextFunction, @Param() { id }: UUIDParamDto) {
    await sendFile(res, next, () => this.service.getProfileImage(id));
  }
}
