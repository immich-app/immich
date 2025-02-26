import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { OnJob } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { SessionResponseDto, mapSession } from 'src/dtos/session.dto';
import { JobName, JobStatus, Permission, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class SessionService extends BaseService {
  @OnJob({ name: JobName.CLEAN_OLD_SESSION_TOKENS, queue: QueueName.BACKGROUND_TASK })
  async handleCleanup(): Promise<JobStatus> {
    const sessions = await this.sessionRepository.search({
      updatedBefore: DateTime.now().minus({ days: 90 }).toJSDate(),
    });

    if (sessions.length === 0) {
      return JobStatus.SKIPPED;
    }

    for (const session of sessions) {
      await this.sessionRepository.delete(session.id);
      this.logger.verbose(`Deleted expired session token: ${session.deviceOS}/${session.deviceType}`);
    }

    this.logger.log(`Deleted ${sessions.length} expired session tokens`);

    return JobStatus.SUCCESS;
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
