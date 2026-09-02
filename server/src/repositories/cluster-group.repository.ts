import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { ClusterGroupRequestTable } from 'src/schema/tables/cluster-group-request.table';

@Injectable()
export class ClusterGroupRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql()
  create() {
    return this.db.insertInto('cluster_group').defaultValues().returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [{ clusterGroupId: DummyValue.UUID, userId: DummyValue.UUID }] })
  async hasOtherMembers({ clusterGroupId, userId }: { clusterGroupId: string; userId: string }): Promise<boolean> {
    const member = await this.db
      .selectFrom('user')
      .select('user.id')
      .where('user.clusterGroupId', '=', clusterGroupId)
      .where('user.id', '!=', userId)
      .where('user.deletedAt', 'is', null)
      .executeTakeFirst();

    return !!member;
  }

  @GenerateSql({ params: [{ clusterGroupId: DummyValue.UUID, userId: DummyValue.UUID }] })
  createRequest(request: Insertable<ClusterGroupRequestTable>) {
    return this.db
      .insertInto('cluster_group_request')
      .values(request)
      .onConflict((oc) =>
        // the update is pointless, but required for the query to return the conflicting row
        oc.columns(['clusterGroupId', 'userId']).doUpdateSet({ clusterGroupId: request.clusterGroupId }),
      )
      .returningAll()
      .returning(sql<boolean>`(xmax = 0)`.as('isInserted'))
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getRequest(id: string) {
    return this.db
      .selectFrom('cluster_group_request')
      .selectAll('cluster_group_request')
      .where('cluster_group_request.id', '=', id)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [{ userId: DummyValue.UUID, clusterGroupId: DummyValue.UUID }] })
  searchRequests({ userId, clusterGroupId }: { userId?: string; clusterGroupId?: string } = {}) {
    return this.db
      .selectFrom('cluster_group_request')
      .selectAll('cluster_group_request')
      .$if(!!userId, (qb) => qb.where('cluster_group_request.userId', '=', userId!))
      .$if(!!clusterGroupId, (qb) => qb.where('cluster_group_request.clusterGroupId', '=', clusterGroupId!))
      .orderBy('cluster_group_request.createdAt', 'asc')
      .execute();
  }

  @GenerateSql({ params: [{ clusterGroupId: DummyValue.UUID, userId: DummyValue.UUID }] })
  getUsers({ clusterGroupId, userId }: { clusterGroupId: string; userId: string }) {
    return this.db
      .selectFrom('user')
      .select(columns.user)
      .where('user.clusterGroupId', '=', clusterGroupId)
      .where('user.deletedAt', 'is', null)
      .orderBy((eb) => eb('user.id', '=', userId), 'desc')
      .orderBy('user.name', 'asc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteRequest(id: string): Promise<void> {
    await this.db.deleteFrom('cluster_group_request').where('cluster_group_request.id', '=', id).execute();
  }
}
