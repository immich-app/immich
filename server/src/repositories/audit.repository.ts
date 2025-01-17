import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DatabaseAction, EntityType } from 'src/enum';
import { AuditSearch, IAuditRepository } from 'src/interfaces/audit.interface';

@Injectable()
export class AuditRepository implements IAuditRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({
    params: [
      DummyValue.DATE,
      { action: DatabaseAction.CREATE, entityType: EntityType.ASSET, userIds: [DummyValue.UUID] },
    ],
  })
  async getAfter(since: Date, options: AuditSearch): Promise<string[]> {
    const records = await this.db
      .selectFrom('audit')
      .where('audit.createdAt', '>', since)
      .$if(!!options.action, (qb) => qb.where('audit.action', '=', options.action!))
      .$if(!!options.entityType, (qb) => qb.where('audit.entityType', '=', options.entityType!))
      .where('audit.ownerId', 'in', options.userIds)
      .distinctOn(['audit.entityId', 'audit.entityType'])
      .orderBy(['audit.entityId desc', 'audit.entityType desc', 'audit.createdAt desc'])
      .select('audit.entityId')
      .execute();

    return records.map(({ entityId }) => entityId);
  }

  @GenerateSql({ params: [DummyValue.DATE] })
  async removeBefore(before: Date): Promise<void> {
    await this.db.deleteFrom('audit').where('createdAt', '<', before).execute();
  }
}
