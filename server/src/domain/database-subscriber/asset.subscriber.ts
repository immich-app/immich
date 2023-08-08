import { AssetEntity } from '@app/infra/entities';
import { EntitySubscriberInterface, EventSubscriber, InsertEvent, RemoveEvent, UpdateEvent } from 'typeorm';

@EventSubscriber()
export class AssetAudit implements EntitySubscriberInterface<AssetEntity> {
  listenTo() {
    return AssetEntity;
  }

  afterInsert(event: InsertEvent<AssetEntity>): void | Promise<any> {
    console.log('AFTER ENTITY INSERTED: ', event.entity);
  }

  afterRemove(event: RemoveEvent<AssetEntity>): void | Promise<any> {
    console.log('AFTER ENTITY WITH ID ' + event.entityId + ' REMOVED: ', event.entity);
  }

  afterUpdate(event: UpdateEvent<AssetEntity>): void | Promise<any> {
    console.log('AFTER ENTITY UPDATED: ', event.entity);
  }
}
