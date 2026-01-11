import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiBody, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
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
  @ApiBody({ description: 'Session creation data', type: SessionCreateDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Session created successfully',
    type: SessionCreateResponseDto,
  })
  @Endpoint({
    summary: 'Create a session',
    description: 'Create a session as a child to the current session. This endpoint is used for casting.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  createSession(@Auth() auth: AuthDto, @Body() dto: SessionCreateDto): Promise<SessionCreateResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get()
  @Authenticated({ permission: Permission.SessionRead })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved sessions', type: [SessionResponseDto] })
  @Endpoint({
    summary: 'Retrieve sessions',
    description: 'Retrieve a list of sessions for the user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getSessions(@Auth() auth: AuthDto): Promise<SessionResponseDto[]> {
    return this.service.getAll(auth);
  }

  @Delete()
  @Authenticated({ permission: Permission.SessionDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'All sessions deleted successfully' })
  @Endpoint({
    summary: 'Delete all sessions',
    description: 'Delete all sessions for the user. This will not delete the current session.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  deleteAllSessions(@Auth() auth: AuthDto): Promise<void> {
    return this.service.deleteAll(auth);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.SessionUpdate })
  @ApiParam({ name: 'id', description: 'Session ID', type: String, format: 'uuid' })
  @ApiBody({ description: 'Session update data', type: SessionUpdateDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Session updated successfully', type: SessionResponseDto })
  @Endpoint({
    summary: 'Update a session',
    description: 'Update a specific session identified by id.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
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
  @ApiParam({ name: 'id', description: 'Session ID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Session deleted successfully' })
  @Endpoint({
    summary: 'Delete a session',
    description: 'Delete a specific session by id.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  deleteSession(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }

  @Post(':id/lock')
  @Authenticated({ permission: Permission.SessionLock })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', description: 'Session ID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Session locked successfully' })
  @Endpoint({
    summary: 'Lock a session',
    description: 'Lock a specific session by id.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  lockSession(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.lock(auth, id);
  }
}
