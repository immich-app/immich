import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { SessionCreateDto, SessionCreateResponseDto, SessionResponseDto, SessionUpdateDto } from 'src/dtos/session.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { SessionService } from 'src/services/session.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.Sessions)
@Controller('sessions')
export class SessionController {
  constructor(private service: SessionService) {}

  @Post()
  @Authenticated({ permission: Permission.SessionCreate })
  @ApiOperation({
    summary: 'Create a session',
    description: 'Create a session as a child to the current session. This endpoint is used for casting.',
  })
  createSession(@Auth() auth: AuthDto, @Body() dto: SessionCreateDto): Promise<SessionCreateResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get()
  @Authenticated({ permission: Permission.SessionRead })
  @ApiOperation({
    summary: 'Retrieve sessions',
    description: 'Retrieve a list of sessions for the user.',
  })
  getSessions(@Auth() auth: AuthDto): Promise<SessionResponseDto[]> {
    return this.service.getAll(auth);
  }

  @Delete()
  @Authenticated({ permission: Permission.SessionDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete all sessions',
    description: 'Delete all sessions for the user. This will not delete the current session.',
  })
  deleteAllSessions(@Auth() auth: AuthDto): Promise<void> {
    return this.service.deleteAll(auth);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.SessionUpdate })
  @ApiOperation({
    summary: 'Update a session',
    description: 'Update a specific session identified by id.',
  })
  updateSession(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: SessionUpdateDto,
  ): Promise<SessionResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.SessionDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a session',
    description: 'Delete a specific session by id.',
  })
  deleteSession(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }

  @Post(':id/lock')
  @Authenticated({ permission: Permission.SessionLock })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Lock a session',
    description: 'Lock a specific session by id.',
  })
  lockSession(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.lock(auth, id);
  }
}
