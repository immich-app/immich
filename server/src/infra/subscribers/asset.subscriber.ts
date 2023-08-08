import { EntitySubscriberInterface, EventSubscriber, InsertEvent, LoadEvent, RemoveEvent, UpdateEvent } from 'typeorm';
import { AssetEntity, AuditEntity, DatabaseAction, EntityType } from '../entities';

@EventSubscriber()
export class AssetAudit implements EntitySubscriberInterface<AssetEntity> {
  private assetEntity: AssetEntity = new AssetEntity();

  listenTo() {
    return AssetEntity;
  }

  afterLoad(entity: AssetEntity): void | Promise<any> {
    this.assetEntity = entity;
  }

  async afterInsert(event: InsertEvent<AssetEntity>): Promise<any> {
    const auditRepository = event.manager.getRepository(AuditEntity);
    const auditEntity = this.getAssetAudit(DatabaseAction.CREATE);

    await auditRepository.save(auditEntity);
  }

  async afterRemove(event: RemoveEvent<AssetEntity>): Promise<any> {
    const auditRepository = event.manager.getRepository(AuditEntity);
    const auditEntity = this.getAssetAudit(DatabaseAction.DELETE);

    await auditRepository.save(auditEntity);
  }

  async afterUpdate(event: UpdateEvent<AssetEntity>): Promise<any> {
    const auditRepository = event.manager.getRepository(AuditEntity);
    const auditEntity = this.getAssetAudit(DatabaseAction.UPDATE);

    await auditRepository.save(auditEntity);
  }

  private getAssetAudit(action: DatabaseAction): AuditEntity {
    const auditEntity = new AuditEntity();

    auditEntity.action = action;
    auditEntity.entityType = EntityType.ASSET;
    auditEntity.entityId = this.assetEntity.id;
    auditEntity.ownerId = this.assetEntity.ownerId;
    auditEntity.userId = this.assetEntity.ownerId;

    return auditEntity;
  }
}
