import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { Chunked, DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { WorkflowActionTable, WorkflowFilterTable, WorkflowTable } from 'src/schema/tables/workflow.table';

@Injectable()
export class WorkflowRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  // ============ Workflow CRUD ============

  @GenerateSql({ params: [DummyValue.UUID] })
  getWorkflow(id: string) {
    return this.db.selectFrom('workflow').selectAll().where('id', '=', id).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getWorkflowsByOwner(ownerId: string) {
    return this.db.selectFrom('workflow').selectAll().where('ownerId', '=', ownerId).orderBy('name').execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getWorkflowsByTrigger(triggerId: string) {
    return this.db.selectFrom('workflow').selectAll().where('triggerId', '=', triggerId).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getEnabledWorkflowsByOwner(ownerId: string) {
    return this.db
      .selectFrom('workflow')
      .selectAll()
      .where('ownerId', '=', ownerId)
      .where('enabled', '=', true)
      .orderBy('name')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.BOOLEAN] })
  getWorkflowsByOwnerAndStatus(ownerId: string, enabled: boolean) {
    return this.db
      .selectFrom('workflow')
      .selectAll()
      .where('ownerId', '=', ownerId)
      .where('enabled', '=', enabled)
      .orderBy('name')
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

  // ============ Workflow Filter CRUD ============

  @GenerateSql({ params: [DummyValue.UUID] })
  getWorkflowFilter(id: string) {
    return this.db.selectFrom('workflow_filter').selectAll().where('id', '=', id).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getWorkflowFiltersByWorkflow(workflowId: string) {
    return this.db
      .selectFrom('workflow_filter')
      .selectAll()
      .where('workflowId', '=', workflowId)
      .orderBy('order', 'asc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getWorkflowFiltersByFilter(filterId: string) {
    return this.db.selectFrom('workflow_filter').selectAll().where('filterId', '=', filterId).execute();
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
  createWorkflowFilter(workflowFilter: Insertable<WorkflowFilterTable>) {
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
  updateWorkflowFilter(id: string, dto: Updateable<WorkflowFilterTable>) {
    return this.db
      .updateTable('workflow_filter')
      .set(dto)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteWorkflowFilter(id: string) {
    await this.db.deleteFrom('workflow_filter').where('id', '=', id).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteWorkflowFiltersByWorkflow(workflowId: string) {
    await this.db.deleteFrom('workflow_filter').where('workflowId', '=', workflowId).execute();
  }

  // ============ Workflow Action CRUD ============

  @GenerateSql({ params: [DummyValue.UUID] })
  getWorkflowAction(id: string) {
    return this.db.selectFrom('workflow_action').selectAll().where('id', '=', id).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getWorkflowActionsByWorkflow(workflowId: string) {
    return this.db
      .selectFrom('workflow_action')
      .selectAll()
      .where('workflowId', '=', workflowId)
      .orderBy('order', 'asc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getWorkflowActionsByAction(actionId: string) {
    return this.db.selectFrom('workflow_action').selectAll().where('actionId', '=', actionId).execute();
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
  createWorkflowAction(workflowAction: Insertable<WorkflowActionTable>) {
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
  updateWorkflowAction(id: string, dto: Updateable<WorkflowActionTable>) {
    return this.db
      .updateTable('workflow_action')
      .set(dto)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteWorkflowAction(id: string) {
    await this.db.deleteFrom('workflow_action').where('id', '=', id).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteWorkflowActionsByWorkflow(workflowId: string) {
    await this.db.deleteFrom('workflow_action').where('workflowId', '=', workflowId).execute();
  }

  // ============ Bulk Operations ============

  @Chunked({ paramIndex: 0 })
  @GenerateSql({ params: [[DummyValue.UUID]] })
  async getWorkflowsByIds(ids: string[]) {
    if (ids.length === 0) {
      return [];
    }
    return this.db.selectFrom('workflow').selectAll().where('id', 'in', ids).execute();
  }

  // ============ Complex Queries ============

  @GenerateSql({ params: [DummyValue.UUID] })
  async getWorkflowWithDetails(id: string) {
    const workflow = await this.getWorkflow(id);
    if (!workflow) {
      return null;
    }

    const [filters, actions] = await Promise.all([
      this.getWorkflowFiltersByWorkflow(id),
      this.getWorkflowActionsByWorkflow(id),
    ]);

    return {
      ...workflow,
      filters,
      actions,
    };
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async countWorkflowsByOwner(ownerId: string) {
    const result = await this.db
      .selectFrom('workflow')
      .select((eb) => eb.fn.countAll<string>().as('count'))
      .where('ownerId', '=', ownerId)
      .executeTakeFirst();

    return Number(result?.count ?? 0);
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async countEnabledWorkflowsByOwner(ownerId: string) {
    const result = await this.db
      .selectFrom('workflow')
      .select((eb) => eb.fn.countAll<string>().as('count'))
      .where('ownerId', '=', ownerId)
      .where('enabled', '=', true)
      .executeTakeFirst();

    return Number(result?.count ?? 0);
  }
}
