import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { PluginTriggerType } from 'src/schema/tables/plugin.table';
import { WorkflowActionTable, WorkflowFilterTable, WorkflowTable } from 'src/schema/tables/workflow.table';

@Injectable()
export class WorkflowRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getWorkflow(id: string) {
    return this.db.selectFrom('workflow').selectAll().where('id', '=', id).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getWorkflowsByOwner(ownerId: string) {
    return this.db.selectFrom('workflow').selectAll().where('ownerId', '=', ownerId).orderBy('name').execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getWorkflowsByTrigger(type: PluginTriggerType) {
    return this.db
      .selectFrom('workflow')
      .selectAll()
      .where('triggerType', '=', type)
      .where('enabled', '=', true)
      .execute();
  }

  @GenerateSql({
    params: [
      {
        ownerId: DummyValue.UUID,
        triggerId: DummyValue.UUID,
        triggerConfig: null,
        name: DummyValue.STRING,
        displayName: DummyValue.STRING,
        description: DummyValue.STRING,
        enabled: DummyValue.BOOLEAN,
      },
    ],
  })
  createWorkflow(workflow: Insertable<WorkflowTable>) {
    return this.db.insertInto('workflow').values(workflow).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({
    params: [
      DummyValue.UUID,
      {
        name: DummyValue.STRING,
        enabled: DummyValue.BOOLEAN,
      },
    ],
  })
  updateWorkflow(id: string, dto: Updateable<WorkflowTable>) {
    return this.db.updateTable('workflow').set(dto).where('id', '=', id).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteWorkflow(id: string) {
    await this.db.deleteFrom('workflow').where('id', '=', id).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getFilter(id: string) {
    return this.db.selectFrom('workflow_filter').selectAll().where('id', '=', id).executeTakeFirst();
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

  @GenerateSql({
    params: [
      {
        workflowId: DummyValue.UUID,
        filterId: DummyValue.UUID,
        filterConfig: null,
        order: DummyValue.NUMBER,
      },
    ],
  })
  createFilter(workflowFilter: Insertable<WorkflowFilterTable>) {
    return this.db.insertInto('workflow_filter').values(workflowFilter).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({
    params: [
      DummyValue.UUID,
      {
        filterConfig: null,
        order: DummyValue.NUMBER,
      },
    ],
  })
  updateFilter(id: string, dto: Updateable<WorkflowFilterTable>) {
    return this.db
      .updateTable('workflow_filter')
      .set(dto)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteFilter(id: string) {
    await this.db.deleteFrom('workflow_filter').where('id', '=', id).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getAction(id: string) {
    return this.db.selectFrom('workflow_action').selectAll().where('id', '=', id).executeTakeFirst();
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

  @GenerateSql({
    params: [
      {
        workflowId: DummyValue.UUID,
        actionId: DummyValue.UUID,
        actionConfig: null,
        order: DummyValue.NUMBER,
      },
    ],
  })
  createAction(workflowAction: Insertable<WorkflowActionTable>) {
    return this.db.insertInto('workflow_action').values(workflowAction).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({
    params: [
      DummyValue.UUID,
      {
        actionConfig: null,
        order: DummyValue.NUMBER,
      },
    ],
  })
  updateAction(id: string, dto: Updateable<WorkflowActionTable>) {
    return this.db
      .updateTable('workflow_action')
      .set(dto)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteAction(id: string) {
    await this.db.deleteFrom('workflow_action').where('id', '=', id).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteActionsByWorkflow(workflowId: string) {
    await this.db.deleteFrom('workflow_action').where('workflowId', '=', workflowId).execute();
  }
}
