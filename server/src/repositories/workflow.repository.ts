import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { PluginTriggerType } from 'src/enum';
import { DB } from 'src/schema';
import { WorkflowActionTable, WorkflowFilterTable, WorkflowTable } from 'src/schema/tables/workflow.table';

@Injectable()
export class WorkflowRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getWorkflow(id: string) {
    return this.db
      .selectFrom('workflow')
      .selectAll()
      .where('id', '=', id)
      .orderBy('createdAt', 'desc')
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getWorkflowsByOwner(ownerId: string) {
    return this.db
      .selectFrom('workflow')
      .selectAll()
      .where('ownerId', '=', ownerId)
      .orderBy('createdAt', 'desc')
      .execute();
  }

  @GenerateSql({ params: [PluginTriggerType.AssetCreate] })
  getWorkflowsByTrigger(type: PluginTriggerType) {
    return this.db
      .selectFrom('workflow')
      .selectAll()
      .where('triggerType', '=', type)
      .where('enabled', '=', true)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, PluginTriggerType.AssetCreate] })
  getWorkflowByOwnerAndTrigger(ownerId: string, type: PluginTriggerType) {
    return this.db
      .selectFrom('workflow')
      .selectAll()
      .where('ownerId', '=', ownerId)
      .where('triggerType', '=', type)
      .where('enabled', '=', true)
      .execute();
  }

  async createWorkflow(
    workflow: Insertable<WorkflowTable>,
    filters: Insertable<WorkflowFilterTable>[],
    actions: Insertable<WorkflowActionTable>[],
  ) {
    return await this.db.transaction().execute(async (tx) => {
      const createdWorkflow = await tx.insertInto('workflow').values(workflow).returningAll().executeTakeFirstOrThrow();

      if (filters.length > 0) {
        const newFilters = filters.map((filter) => ({
          ...filter,
          workflowId: createdWorkflow.id,
        }));

        await tx.insertInto('workflow_filter').values(newFilters).execute();
      }

      if (actions.length > 0) {
        const newActions = actions.map((action) => ({
          ...action,
          workflowId: createdWorkflow.id,
        }));
        await tx.insertInto('workflow_action').values(newActions).execute();
      }

      return createdWorkflow;
    });
  }

  async updateWorkflow(
    id: string,
    workflow: Updateable<WorkflowTable>,
    filters: Insertable<WorkflowFilterTable>[] | undefined,
    actions: Insertable<WorkflowActionTable>[] | undefined,
  ) {
    return await this.db.transaction().execute(async (trx) => {
      if (Object.keys(workflow).length > 0) {
        await trx.updateTable('workflow').set(workflow).where('id', '=', id).execute();
      }

      if (filters !== undefined) {
        await trx.deleteFrom('workflow_filter').where('workflowId', '=', id).execute();
        if (filters.length > 0) {
          const filtersWithWorkflowId = filters.map((filter) => ({
            ...filter,
            workflowId: id,
          }));
          await trx.insertInto('workflow_filter').values(filtersWithWorkflowId).execute();
        }
      }

      if (actions !== undefined) {
        await trx.deleteFrom('workflow_action').where('workflowId', '=', id).execute();
        if (actions.length > 0) {
          const actionsWithWorkflowId = actions.map((action) => ({
            ...action,
            workflowId: id,
          }));
          await trx.insertInto('workflow_action').values(actionsWithWorkflowId).execute();
        }
      }

      return await trx.selectFrom('workflow').selectAll().where('id', '=', id).executeTakeFirstOrThrow();
    });
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteWorkflow(id: string) {
    await this.db.deleteFrom('workflow').where('id', '=', id).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getFilters(workflowId: string) {
    return this.db
      .selectFrom('workflow_filter')
      .selectAll()
      .where('workflowId', '=', workflowId)
      .orderBy('order', 'asc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteFiltersByWorkflow(workflowId: string) {
    await this.db.deleteFrom('workflow_filter').where('workflowId', '=', workflowId).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getActions(workflowId: string) {
    return this.db
      .selectFrom('workflow_action')
      .selectAll()
      .where('workflowId', '=', workflowId)
      .orderBy('order', 'asc')
      .execute();
  }
}
