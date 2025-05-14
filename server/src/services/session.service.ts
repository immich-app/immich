import { BadRequestException, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { OnJob } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { SessionCreateDto, SessionCreateResponseDto, SessionResponseDto, mapSession } from 'src/dtos/session.dto';
import { JobName, JobStatus, Permission, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class SessionService extends BaseService {
  @OnJob({ name: JobName.CLEAN_OLD_SESSION_TOKENS, queue: QueueName.BACKGROUND_TASK })
  async handleCleanup(): Promise<JobStatus> {
    const sessions = await this.sessionRepository.cleanup();
    for (const session of sessions) {
      this.logger.verbose(`Deleted expired session token: ${session.deviceOS}/${session.deviceType}`);
    }

    this.logger.log(`Deleted ${sessions.length} expired session tokens`);

    return JobStatus.SUCCESS;
  }

  async create(auth: AuthDto, dto: SessionCreateDto): Promise<SessionCreateResponseDto> {
    if (!auth.session) {
      throw new BadRequestException('This endpoint can only be used with a session token');
    }

    const token = this.cryptoRepository.randomBytesAsText(32);
    const tokenHashed = this.cryptoRepository.hashSha256(token);
    const session = await this.sessionRepository.create({
      parentId: auth.session.id,
      userId: auth.user.id,
      expiredAt: dto.duration ? DateTime.now().plus({ seconds: dto.duration }).toJSDate() : null,
      deviceType: dto.deviceType,
      deviceOS: dto.deviceOS,
      token: tokenHashed,
    });

    return { ...mapSession(session), token };
  }

  async getAll(auth: AuthDto): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionRepository.getByUserId(auth.user.id);
    return sessions.map((session) => mapSession(session, auth.session?.id));
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.AUTH_DEVICE_DELETE, ids: [id] });
    await this.sessionRepository.delete(id);
  }

  async deleteAll(auth: AuthDto): Promise<void> {
    const sessions = await this.sessionRepository.getByUserId(auth.user.id);
    for (const session of sessions) {
      if (session.id === auth.session?.id) {
        continue;
      }
      await this.sessionRepository.delete(session.id);
    }
  }
}
