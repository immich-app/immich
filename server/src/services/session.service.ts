import { Inject, Injectable } from '@nestjs/common';
import { AccessCore, AccessPermission } from 'src/cores/access.core';
import { AuthDto } from 'src/dtos/auth.dto';
import { SessionResponseDto, mapSession } from 'src/dtos/session.dto';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { ISessionRepository } from 'src/interfaces/session.interface';

@Injectable()
export class SessionService {
  private access: AccessCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
    @Inject(ISessionRepository) private sessionRepository: ISessionRepository,
  ) {
    this.logger.setContext(SessionService.name);
    this.access = AccessCore.create(accessRepository);
  }

  async getAll(auth: AuthDto): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionRepository.getByUserId(auth.user.id);
    return sessions.map((session) => mapSession(session, auth.session?.id));
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    await this.access.requirePermission(auth, AccessPermission.AUTH_DEVICE_DELETE, id);
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
