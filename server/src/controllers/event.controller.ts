import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { CreateEventDto, EventResponseDto, EventStatisticsResponseDto, UpdateEventDto } from 'src/dtos/event.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { EventService } from 'src/services/event.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.Events)
@Controller('events')
export class EventController {
  constructor(private service: EventService) {}

  @Get()
  @Authenticated({ permission: Permission.EventRead })
  @Endpoint({
    summary: 'List all events',
    description: 'Retrieve a list of events available to the authenticated user.',
    history: new HistoryBuilder().added('v3'),
  })
  getAllEvents(@Auth() auth: AuthDto): Promise<EventResponseDto[]> {
    return this.service.getAll(auth);
  }

  @Post()
  @Authenticated({ permission: Permission.EventCreate })
  @Endpoint({
    summary: 'Create an event',
    description: 'Create a new event.',
    history: new HistoryBuilder().added('v3'),
  })
  createEvent(@Auth() auth: AuthDto, @Body() dto: CreateEventDto): Promise<EventResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get('statistics')
  @Authenticated({ permission: Permission.EventStatistics })
  @Endpoint({
    summary: 'Retrieve event statistics',
    description: 'Returns statistics about the events available to the authenticated user.',
    history: new HistoryBuilder().added('v3'),
  })
  getEventStatistics(@Auth() auth: AuthDto): Promise<EventStatisticsResponseDto> {
    return this.service.getStatistics(auth);
  }

  @Authenticated({ permission: Permission.EventRead })
  @Get(':id')
  @Endpoint({
    summary: 'Retrieve an event',
    description: 'Retrieve information about a specific event by its ID.',
    history: new HistoryBuilder().added('v3'),
  })
  getEventInfo(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<EventResponseDto> {
    return this.service.get(auth, id);
  }

  @Patch(':id')
  @Authenticated({ permission: Permission.EventUpdate })
  @Endpoint({
    summary: 'Update an event',
    description: 'Update the information of a specific event by its ID.',
    history: new HistoryBuilder().added('v3'),
  })
  updateEventInfo(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UpdateEventDto,
  ): Promise<EventResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.EventDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete an event',
    description: 'Delete a specific event by its ID.',
    history: new HistoryBuilder().added('v3'),
  })
  deleteEvent(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }
}
