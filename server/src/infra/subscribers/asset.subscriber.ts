import { EntitySubscriberInterface, EventSubscriber, InsertEvent, LoadEvent, RemoveEvent, UpdateEvent } from 'typeorm';
import { AssetEntity, AuditEntity, DatabaseAction, EntityType } from '../entities';

@EventSubscriber()
export class AssetAudit implements EntitySubscriberInterface<AssetEntity> {
  private assetEntity: AssetEntity = new AssetEntity();

  listenTo() {
    return AssetEntity;
  }

  afterLoad(entity: AssetEntity, event?: LoadEvent<AssetEntity> | undefined): void | Promise<any> {
    this.assetEntity = entity;
  }

  afterInsert(event: InsertEvent<AssetEntity>): void | Promise<any> {
    console.log('AFTER ENTITY INSERTED: ', event.entity);
  }

  afterRemove(event: RemoveEvent<AssetEntity>): void | Promise<any> {
    console.log('AFTER ENTITY WITH ID ' + event.entityId + ' REMOVED: ', event.entity);
  }

  async afterUpdate(event: UpdateEvent<AssetEntity>): Promise<any> {
    const audit = event.manager.getRepository(AuditEntity);
    const auditEntity = new AuditEntity();

    auditEntity.action = DatabaseAction.UPDATE;
    auditEntity.entityType = EntityType.ASSET;

    console.log('AFTER ENTITY UPDATED: ', this.assetEntity.isFavorite);
  }
}
