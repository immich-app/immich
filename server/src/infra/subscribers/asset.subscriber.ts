import {
  EntityManager,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';
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
    await this.addAction(DatabaseAction.CREATE, event.manager);
  }

  async afterRemove(event: RemoveEvent<AssetEntity>): Promise<any> {
    await this.addAction(DatabaseAction.DELETE, event.manager);
  }

  async afterUpdate(event: UpdateEvent<AssetEntity>): Promise<any> {
    await this.addAction(DatabaseAction.UPDATE, event.manager);
  }

  private async addAction(action: DatabaseAction, manager: EntityManager): Promise<any> {
    const auditEntity = this.getAssetAudit(action);
    const repository = manager.getRepository(AuditEntity);
    await repository.save(auditEntity);
  }

  private getAssetAudit(action: DatabaseAction): AuditEntity {
    const auditEntity = new AuditEntity();

    auditEntity.action = action;
    auditEntity.entityType = EntityType.ASSET;
    auditEntity.entityId = this.assetEntity.id;
    auditEntity.ownerId = this.assetEntity.ownerId;

    return auditEntity;
  }
}
