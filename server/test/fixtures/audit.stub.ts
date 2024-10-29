import { AuditEntity } from 'src/entities/audit.entity';
import { DatabaseAction, EntityType } from 'src/enum';
import { authStub } from 'test/fixtures/auth.stub';

export const auditStub = {
  delete: Object.freeze<AuditEntity>({
    id: 3,
    entityId: 'asset-deleted',
    action: DatabaseAction.DELETE,
    entityType: EntityType.ASSET,
    ownerId: authStub.admin.user.id,
    createdAt: new Date(),
  }),
};
