import { AuditEntity, DatabaseAction, EntityType } from '@app/infra/entities';
import { assetStub, authStub } from '.';

export const auditStub = {
  create: Object.freeze<AuditEntity>({
    id: 1,
    entityId: assetStub.image.id,
    action: DatabaseAction.CREATE,
    entityType: EntityType.ASSET,
    ownerId: authStub.admin.id,
    time: new Date(),
  }),
  update: Object.freeze<AuditEntity>({
    id: 2,
    entityId: assetStub.image.id,
    action: DatabaseAction.UPDATE,
    entityType: EntityType.ASSET,
    ownerId: authStub.admin.id,
    time: new Date(),
  }),
  delete: Object.freeze<AuditEntity>({
    id: 3,
    entityId: assetStub.image.id,
    action: DatabaseAction.DELETE,
    entityType: EntityType.ASSET,
    ownerId: authStub.admin.id,
    time: new Date(),
  }),
};
