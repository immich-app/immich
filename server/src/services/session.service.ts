import { BadRequestException, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { OnEvent, OnJob } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  SessionCreateDto,
  SessionCreateResponseDto,
  SessionResponseDto,
  SessionUpdateDto,
  mapSession,
} from 'src/dtos/session.dto';
import { JobName, JobStatus, Permission, QueueName } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class SessionService extends BaseService {
  @OnJob({ name: JobName.SessionCleanup, queue: QueueName.BackgroundTask })
  async handleCleanup(): Promise<JobStatus> {
    const sessions = await this.sessionRepository.cleanup();
    for (const session of sessions) {
      this.logger.verbose(`Deleted expired session token: ${session.deviceOS}/${session.deviceType}`);
    }

    this.logger.log(`Deleted ${sessions.length} expired session tokens`);

    return JobStatus.Success;
  }

  async create(auth: AuthDto, dto: SessionCreateDto): Promise<SessionCreateResponseDto> {
    if (!auth.session) {
      throw new BadRequestException('This endpoint can only be used with a session token');
    }

    const token = this.cryptoRepository.randomBytesAsText(32);
    const hashed = this.cryptoRepository.hashSha256(token);
    const session = await this.sessionRepository.create({
      parentId: auth.session.id,
      userId: auth.user.id,
      expiresAt: dto.duration ? DateTime.now().plus({ seconds: dto.duration }).toJSDate() : null,
      deviceType: dto.deviceType,
      deviceOS: dto.deviceOS,
      token: hashed,
    });

    return { ...mapSession(session), token };
  }

  async getAll(auth: AuthDto): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionRepository.getByUserId(auth.user.id);
    return sessions.map((session) => mapSession(session, auth.session?.id));
  }

  async update(auth: AuthDto, id: string, dto: SessionUpdateDto): Promise<SessionResponseDto> {
    await this.requireAccess({ auth, permission: Permission.SessionUpdate, ids: [id] });

    if (Object.values(dto).filter((prop) => prop !== undefined).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const session = await this.sessionRepository.update(id, {
      isPendingSyncReset: dto.isPendingSyncReset,
    });

    return mapSession(session);
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.AuthDeviceDelete, ids: [id] });
    await this.sessionRepository.delete(id);
  }

  async deleteAll(auth: AuthDto): Promise<void> {
    const userId = auth.user.id;
    const currentSessionId = auth.session?.id;
    await this.sessionRepository.invalidate({ userId, excludeId: currentSessionId });
  }

  async lock(auth: AuthDto, id: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.SessionLock, ids: [id] });
    await this.sessionRepository.update(id, { pinExpiresAt: null });
  }

  @OnEvent({ name: 'AuthChangePassword' })
  async onAuthChangePassword({ userId, currentSessionId }: ArgOf<'AuthChangePassword'>): Promise<void> {
    await this.sessionRepository.invalidate({ userId, excludeId: currentSessionId });
  }
}
