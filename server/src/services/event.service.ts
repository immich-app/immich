import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  CreateEventDto,
  EventResponseDto,
  EventStatisticsResponseDto,
  mapEvent,
  MapEventDto,
  UpdateEventDto,
} from 'src/dtos/event.dto';
import { Permission } from 'src/enum';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class EventService extends BaseService {
  async getStatistics(auth: AuthDto): Promise<EventStatisticsResponseDto> {
    const statistics = await this.eventEntityRepository.getStatistics(auth.user.id);
    return {
      owned: statistics.owned,
    };
  }

  async getAll(auth: AuthDto): Promise<EventResponseDto[]> {
    const events = await this.eventEntityRepository.getAllAccessible(auth.user.id);
    return events.map((event) => {
      const dto = mapEvent(event as MapEventDto);
      dto.isOwner = event.ownerId === auth.user.id;
      return dto;
    });
  }

  async get(auth: AuthDto, id: string): Promise<EventResponseDto> {
    await this.requireAccess({ auth, permission: Permission.EventRead, ids: [id] });
    const event = await this.findOrFail(id);
    const dto = mapEvent(event as MapEventDto);
    dto.isOwner = event.ownerId === auth.user.id;
    return dto;
  }

  async create(auth: AuthDto, dto: CreateEventDto): Promise<EventResponseDto> {
    const event = await this.eventEntityRepository.create({
      ownerId: auth.user.id,
      eventName: dto.eventName,
      description: dto.description || '',
      eventThumbnailAssetId: dto.eventThumbnailAssetId || null,
    });

    if (!event) {
      throw new BadRequestException('Failed to create event');
    }

    return mapEvent(event as MapEventDto);
  }

  async update(auth: AuthDto, id: string, dto: UpdateEventDto): Promise<EventResponseDto> {
    await this.requireAccess({ auth, permission: Permission.EventUpdate, ids: [id] });

    const event = await this.eventEntityRepository.update(id, {
      eventName: dto.eventName,
      description: dto.description,
      eventThumbnailAssetId: dto.eventThumbnailAssetId,
    });

    if (!event) {
      throw new BadRequestException('Failed to update event');
    }

    return mapEvent(event as MapEventDto);
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.EventDelete, ids: [id] });
    await this.eventEntityRepository.delete([id]);
  }

  private async findOrFail(id: string) {
    const event = await this.eventEntityRepository.getById(id);
    if (!event) {
      throw new BadRequestException('Event not found');
    }
    return event;
  }
}
