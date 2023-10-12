import { DatabaseAction } from '@app/infra/entities';
import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { AccessCore, Permission } from '../access';
import { AuthUserDto } from '../auth';
import { AUDIT_LOG_MAX_DURATION } from '../domain.constant';
import { IAccessRepository, IAuditRepository } from '../repositories';
import { AuditDeletesDto, AuditDeletesResponseDto } from './audit.dto';

@Injectable()
export class AuditService {
  private access: AccessCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAuditRepository) private repository: IAuditRepository,
  ) {
    this.access = new AccessCore(accessRepository);
  }

  async handleCleanup(): Promise<boolean> {
    await this.repository.removeBefore(DateTime.now().minus(AUDIT_LOG_MAX_DURATION).toJSDate());
    return true;
  }

  async getDeletes(authUser: AuthUserDto, dto: AuditDeletesDto): Promise<AuditDeletesResponseDto> {
    const userId = dto.userId || authUser.id;
    await this.access.requirePermission(authUser, Permission.TIMELINE_READ, userId);

    const audits = await this.repository.getAfter(dto.after, {
      ownerId: userId,
      entityType: dto.entityType,
      action: DatabaseAction.DELETE,
    });

    const duration = DateTime.now().diff(DateTime.fromJSDate(dto.after));

    return {
      needsFullSync: duration > AUDIT_LOG_MAX_DURATION,
      ids: audits.map(({ entityId }) => entityId),
    };
  }
}
