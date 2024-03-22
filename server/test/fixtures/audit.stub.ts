import { AuditEntity, DatabaseAction, EntityType } from 'src/entities/audit.entity';
import { authStub } from 'test/fixtures/auth.stub';

export const auditStub = {
  create: Object.freeze<AuditEntity>({
    id: 1,
    entityId: 'asset-created',
    action: DatabaseAction.CREATE,
    entityType: EntityType.ASSET,
    ownerId: authStub.admin.user.id,
    createdAt: new Date(),
  }),
  update: Object.freeze<AuditEntity>({
    id: 2,
    entityId: 'asset-updated',
    action: DatabaseAction.UPDATE,
    entityType: EntityType.ASSET,
    ownerId: authStub.admin.user.id,
    createdAt: new Date(),
  }),
  delete: Object.freeze<AuditEntity>({
    id: 3,
    entityId: 'asset-deleted',
    action: DatabaseAction.DELETE,
    entityType: EntityType.ASSET,
    ownerId: authStub.admin.user.id,
    createdAt: new Date(),
  }),
};
