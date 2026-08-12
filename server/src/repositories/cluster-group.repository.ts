import { Injectable } from '@nestjs/common';
import { Insertable, Kysely } from 'kysely';
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

  @GenerateSql({ params: [DummyValue.UUID] })
  async getForUser(userId: string): Promise<string> {
    const { clusterGroupId } = await this.db
      .selectFrom('user')
      .select('user.clusterGroupId')
      .where('user.id', '=', userId)
      .executeTakeFirstOrThrow();

    return clusterGroupId;
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

  /** returns nothing when the request already existed */
  @GenerateSql({ params: [{ clusterGroupId: DummyValue.UUID, userId: DummyValue.UUID }] })
  createRequest(request: Insertable<ClusterGroupRequestTable>) {
    return this.db
      .insertInto('cluster_group_request')
      .values(request)
      .onConflict((oc) => oc.columns(['clusterGroupId', 'userId']).doNothing())
      .returningAll()
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

  @GenerateSql({ params: [{ clusterGroupId: DummyValue.UUID, userId: DummyValue.UUID }] })
  getRequestFor({ clusterGroupId, userId }: { clusterGroupId: string; userId: string }) {
    return this.db
      .selectFrom('cluster_group_request')
      .selectAll('cluster_group_request')
      .where('cluster_group_request.clusterGroupId', '=', clusterGroupId)
      .where('cluster_group_request.userId', '=', userId)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getRequests(userId: string) {
    return this.db
      .selectFrom('cluster_group_request')
      .selectAll('cluster_group_request')
      .where('cluster_group_request.userId', '=', userId)
      .orderBy('cluster_group_request.createdAt', 'asc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getRequestsForGroup(clusterGroupId: string) {
    return this.db
      .selectFrom('cluster_group_request')
      .selectAll('cluster_group_request')
      .where('cluster_group_request.clusterGroupId', '=', clusterGroupId)
      .orderBy('cluster_group_request.createdAt', 'asc')
      .execute();
  }

  @GenerateSql({ params: [{ clusterGroupId: DummyValue.UUID, userId: DummyValue.UUID }] })
  getUsers({ clusterGroupId, userId }: { clusterGroupId: string; userId: string }) {
    return (
      this.db
        .selectFrom('user')
        .select(columns.user)
        .where('user.clusterGroupId', '=', clusterGroupId)
        .where('user.deletedAt', 'is', null)
        // the current user comes first, everyone else in alphabetical order
        .orderBy((eb) => eb('user.id', '=', userId), 'desc')
        .orderBy('user.name', 'asc')
        .execute()
    );
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteRequest(id: string): Promise<void> {
    await this.db.deleteFrom('cluster_group_request').where('cluster_group_request.id', '=', id).execute();
  }
}
