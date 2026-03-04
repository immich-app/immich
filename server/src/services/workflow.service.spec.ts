import { BadRequestException } from '@nestjs/common';
import { PluginContext, PluginTriggerType } from 'src/enum';
import { WorkflowService } from 'src/services/workflow.service';
import { factory, newUuid, newUuids } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

describe(WorkflowService.name, () => {
  let sut: WorkflowService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(WorkflowService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  const makeWorkflow = (overrides: Record<string, unknown> = {}) => {
    return {
      id: newUuid(),
      ownerId: newUuid(),
      triggerType: PluginTriggerType.AssetCreate,
      name: 'Test Workflow',
      description: 'A test workflow',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      enabled: true,
      ...overrides,
    };
  };

  const makeFilter = (overrides: Record<string, unknown> = {}) => {
    return {
      id: newUuid(),
      workflowId: newUuid(),
      pluginFilterId: newUuid(),
      filterConfig: null,
      order: 0,
      ...overrides,
    };
  };

  const makeAction = (overrides: Record<string, unknown> = {}) => {
    return {
      id: newUuid(),
      workflowId: newUuid(),
      pluginActionId: newUuid(),
      actionConfig: null,
      order: 0,
      ...overrides,
    };
  };

  const makePluginFilter = (overrides: Record<string, unknown> = {}) => {
    return {
      id: newUuid(),
      pluginId: newUuid(),
      methodName: 'testFilter',
      title: 'Test Filter',
      description: 'A test filter',
      supportedContexts: [PluginContext.Asset],
      schema: null,
      ...overrides,
    };
  };

  const makePluginAction = (overrides: Record<string, unknown> = {}) => {
    return {
      id: newUuid(),
      pluginId: newUuid(),
      methodName: 'testAction',
      title: 'Test Action',
      description: 'A test action',
      supportedContexts: [PluginContext.Asset],
      schema: null,
      ...overrides,
    };
  };

  describe('create', () => {
    it('should create a workflow with filters and actions', async () => {
      const auth = factory.auth();
      const [filterId, actionId] = newUuids();
      const pluginFilter = makePluginFilter({ id: filterId });
      const pluginAction = makePluginAction({ id: actionId });
      const workflow = makeWorkflow({ ownerId: auth.user.id });
      const workflowFilter = makeFilter({ workflowId: workflow.id, pluginFilterId: filterId });
      const workflowAction = makeAction({ workflowId: workflow.id, pluginActionId: actionId });

      mocks.plugin.getFilter.mockResolvedValue(pluginFilter as any);
      mocks.plugin.getAction.mockResolvedValue(pluginAction as any);
      mocks.workflow.createWorkflow.mockResolvedValue(workflow as any);
      mocks.workflow.getFilters.mockResolvedValue([workflowFilter as any]);
      mocks.workflow.getActions.mockResolvedValue([workflowAction as any]);

      const result = await sut.create(auth, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'Test Workflow',
        description: 'A test workflow',
        filters: [{ pluginFilterId: filterId }],
        actions: [{ pluginActionId: actionId }],
      });

      expect(result).toEqual({
        id: workflow.id,
        ownerId: auth.user.id,
        triggerType: PluginTriggerType.AssetCreate,
        name: 'Test Workflow',
        description: 'A test workflow',
        createdAt: workflow.createdAt.toISOString(),
        enabled: true,
        filters: [expect.objectContaining({ pluginFilterId: filterId })],
        actions: [expect.objectContaining({ pluginActionId: actionId })],
      });

      expect(mocks.workflow.createWorkflow).toHaveBeenCalledWith(
        {
          ownerId: auth.user.id,
          triggerType: PluginTriggerType.AssetCreate,
          name: 'Test Workflow',
          description: 'A test workflow',
          enabled: true,
        },
        [{ pluginFilterId: filterId, filterConfig: null, order: 0 }],
        [{ pluginActionId: actionId, actionConfig: null, order: 0 }],
      );
    });

    it('should create a workflow with empty filters and actions', async () => {
      const auth = factory.auth();
      const workflow = makeWorkflow({ ownerId: auth.user.id, description: '' });

      mocks.workflow.createWorkflow.mockResolvedValue(workflow as any);
      mocks.workflow.getFilters.mockResolvedValue([]);
      mocks.workflow.getActions.mockResolvedValue([]);

      const result = await sut.create(auth, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'Test Workflow',
        filters: [],
        actions: [],
      });

      expect(result).toEqual({
        id: workflow.id,
        ownerId: auth.user.id,
        triggerType: PluginTriggerType.AssetCreate,
        name: 'Test Workflow',
        description: '',
        createdAt: workflow.createdAt.toISOString(),
        enabled: true,
        filters: [],
        actions: [],
      });

      expect(mocks.workflow.createWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: auth.user.id,
          description: '',
          enabled: true,
        }),
        [],
        [],
      );
    });

    it('should default enabled to true when not specified', async () => {
      const auth = factory.auth();
      const workflow = makeWorkflow({ ownerId: auth.user.id, enabled: true });

      mocks.workflow.createWorkflow.mockResolvedValue(workflow as any);
      mocks.workflow.getFilters.mockResolvedValue([]);
      mocks.workflow.getActions.mockResolvedValue([]);

      await sut.create(auth, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'Test Workflow',
        filters: [],
        actions: [],
      });

      expect(mocks.workflow.createWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: true }),
        [],
        [],
      );
    });

    it('should allow setting enabled to false', async () => {
      const auth = factory.auth();
      const workflow = makeWorkflow({ ownerId: auth.user.id, enabled: false });

      mocks.workflow.createWorkflow.mockResolvedValue(workflow as any);
      mocks.workflow.getFilters.mockResolvedValue([]);
      mocks.workflow.getActions.mockResolvedValue([]);

      await sut.create(auth, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'Test Workflow',
        enabled: false,
        filters: [],
        actions: [],
      });

      expect(mocks.workflow.createWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false }),
        [],
        [],
      );
    });

    it('should throw for an invalid trigger type', async () => {
      const auth = factory.auth();

      await expect(
        sut.create(auth, {
          triggerType: 'InvalidTrigger' as PluginTriggerType,
          name: 'Test',
          filters: [],
          actions: [],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.workflow.createWorkflow).not.toHaveBeenCalled();
    });

    it('should throw for an invalid filter ID', async () => {
      const auth = factory.auth();
      const invalidFilterId = newUuid();

      mocks.plugin.getFilter.mockResolvedValue(undefined);

      await expect(
        sut.create(auth, {
          triggerType: PluginTriggerType.AssetCreate,
          name: 'Test',
          filters: [{ pluginFilterId: invalidFilterId }],
          actions: [],
        }),
      ).rejects.toThrow(`Invalid filter ID: ${invalidFilterId}`);

      expect(mocks.workflow.createWorkflow).not.toHaveBeenCalled();
    });

    it('should throw for an invalid action ID', async () => {
      const auth = factory.auth();
      const invalidActionId = newUuid();

      mocks.plugin.getAction.mockResolvedValue(undefined);

      await expect(
        sut.create(auth, {
          triggerType: PluginTriggerType.AssetCreate,
          name: 'Test',
          filters: [],
          actions: [{ pluginActionId: invalidActionId }],
        }),
      ).rejects.toThrow(`Invalid action ID: ${invalidActionId}`);

      expect(mocks.workflow.createWorkflow).not.toHaveBeenCalled();
    });

    it('should throw when filter does not support the trigger context', async () => {
      const auth = factory.auth();
      const filterId = newUuid();
      const pluginFilter = makePluginFilter({
        id: filterId,
        title: 'Person Only Filter',
        supportedContexts: [PluginContext.Person],
      });

      mocks.plugin.getFilter.mockResolvedValue(pluginFilter as any);

      await expect(
        sut.create(auth, {
          triggerType: PluginTriggerType.AssetCreate,
          name: 'Test',
          filters: [{ pluginFilterId: filterId }],
          actions: [],
        }),
      ).rejects.toThrow('does not support asset context');

      expect(mocks.workflow.createWorkflow).not.toHaveBeenCalled();
    });

    it('should throw when action does not support the trigger context', async () => {
      const auth = factory.auth();
      const actionId = newUuid();
      const pluginAction = makePluginAction({
        id: actionId,
        title: 'Person Only Action',
        supportedContexts: [PluginContext.Person],
      });

      mocks.plugin.getAction.mockResolvedValue(pluginAction as any);

      await expect(
        sut.create(auth, {
          triggerType: PluginTriggerType.AssetCreate,
          name: 'Test',
          filters: [],
          actions: [{ pluginActionId: actionId }],
        }),
      ).rejects.toThrow('does not support asset context');

      expect(mocks.workflow.createWorkflow).not.toHaveBeenCalled();
    });

    it('should preserve filter and action order', async () => {
      const auth = factory.auth();
      const [filterId1, filterId2, actionId1, actionId2] = newUuids();
      const pluginFilter1 = makePluginFilter({ id: filterId1 });
      const pluginFilter2 = makePluginFilter({ id: filterId2 });
      const pluginAction1 = makePluginAction({ id: actionId1 });
      const pluginAction2 = makePluginAction({ id: actionId2 });
      const workflow = makeWorkflow({ ownerId: auth.user.id });

      mocks.plugin.getFilter.mockResolvedValueOnce(pluginFilter1 as any).mockResolvedValueOnce(pluginFilter2 as any);
      mocks.plugin.getAction.mockResolvedValueOnce(pluginAction1 as any).mockResolvedValueOnce(pluginAction2 as any);
      mocks.workflow.createWorkflow.mockResolvedValue(workflow as any);
      mocks.workflow.getFilters.mockResolvedValue([]);
      mocks.workflow.getActions.mockResolvedValue([]);

      await sut.create(auth, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'Test',
        filters: [{ pluginFilterId: filterId1 }, { pluginFilterId: filterId2 }],
        actions: [{ pluginActionId: actionId1 }, { pluginActionId: actionId2 }],
      });

      expect(mocks.workflow.createWorkflow).toHaveBeenCalledWith(
        expect.anything(),
        [
          { pluginFilterId: filterId1, filterConfig: null, order: 0 },
          { pluginFilterId: filterId2, filterConfig: null, order: 1 },
        ],
        [
          { pluginActionId: actionId1, actionConfig: null, order: 0 },
          { pluginActionId: actionId2, actionConfig: null, order: 1 },
        ],
      );
    });

    it('should pass filter and action configs', async () => {
      const auth = factory.auth();
      const [filterId, actionId] = newUuids();
      const filterConfig = { key: 'value' };
      const actionConfig = { action: 'do_something' };
      const pluginFilter = makePluginFilter({ id: filterId });
      const pluginAction = makePluginAction({ id: actionId });
      const workflow = makeWorkflow({ ownerId: auth.user.id });

      mocks.plugin.getFilter.mockResolvedValue(pluginFilter as any);
      mocks.plugin.getAction.mockResolvedValue(pluginAction as any);
      mocks.workflow.createWorkflow.mockResolvedValue(workflow as any);
      mocks.workflow.getFilters.mockResolvedValue([]);
      mocks.workflow.getActions.mockResolvedValue([]);

      await sut.create(auth, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'Test',
        filters: [{ pluginFilterId: filterId, filterConfig }],
        actions: [{ pluginActionId: actionId, actionConfig }],
      });

      expect(mocks.workflow.createWorkflow).toHaveBeenCalledWith(
        expect.anything(),
        [{ pluginFilterId: filterId, filterConfig, order: 0 }],
        [{ pluginActionId: actionId, actionConfig, order: 0 }],
      );
    });

    it('should create a workflow with PersonRecognized trigger type', async () => {
      const auth = factory.auth();
      const actionId = newUuid();
      const pluginAction = makePluginAction({
        id: actionId,
        supportedContexts: [PluginContext.Person],
      });
      const workflow = makeWorkflow({
        ownerId: auth.user.id,
        triggerType: PluginTriggerType.PersonRecognized,
      });

      mocks.plugin.getAction.mockResolvedValue(pluginAction as any);
      mocks.workflow.createWorkflow.mockResolvedValue(workflow as any);
      mocks.workflow.getFilters.mockResolvedValue([]);
      mocks.workflow.getActions.mockResolvedValue([]);

      await sut.create(auth, {
        triggerType: PluginTriggerType.PersonRecognized,
        name: 'Test',
        filters: [],
        actions: [{ pluginActionId: actionId }],
      });

      expect(mocks.workflow.createWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({ triggerType: PluginTriggerType.PersonRecognized }),
        [],
        [{ pluginActionId: actionId, actionConfig: null, order: 0 }],
      );
    });
  });

  describe('getAll', () => {
    it('should return all workflows for the authenticated user', async () => {
      const auth = factory.auth();
      const workflow1 = makeWorkflow({ ownerId: auth.user.id });
      const workflow2 = makeWorkflow({ ownerId: auth.user.id });

      mocks.workflow.getWorkflowsByOwner.mockResolvedValue([workflow1 as any, workflow2 as any]);
      mocks.workflow.getFilters.mockResolvedValue([]);
      mocks.workflow.getActions.mockResolvedValue([]);

      const result = await sut.getAll(auth);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(workflow1.id);
      expect(result[1].id).toBe(workflow2.id);
      expect(mocks.workflow.getWorkflowsByOwner).toHaveBeenCalledWith(auth.user.id);
    });

    it('should return an empty array when user has no workflows', async () => {
      const auth = factory.auth();

      mocks.workflow.getWorkflowsByOwner.mockResolvedValue([]);

      const result = await sut.getAll(auth);

      expect(result).toEqual([]);
      expect(mocks.workflow.getWorkflowsByOwner).toHaveBeenCalledWith(auth.user.id);
    });

    it('should include filters and actions in the response', async () => {
      const auth = factory.auth();
      const workflow = makeWorkflow({ ownerId: auth.user.id });
      const filter = makeFilter({ workflowId: workflow.id });
      const action = makeAction({ workflowId: workflow.id });

      mocks.workflow.getWorkflowsByOwner.mockResolvedValue([workflow as any]);
      mocks.workflow.getFilters.mockResolvedValue([filter as any]);
      mocks.workflow.getActions.mockResolvedValue([action as any]);

      const result = await sut.getAll(auth);

      expect(result).toHaveLength(1);
      expect(result[0].filters).toHaveLength(1);
      expect(result[0].actions).toHaveLength(1);
      expect(result[0].filters[0].id).toBe(filter.id);
      expect(result[0].actions[0].id).toBe(action.id);
    });
  });

  describe('get', () => {
    it('should require workflow.read access', async () => {
      const auth = factory.auth();
      const id = newUuid();

      await expect(sut.get(auth, id)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.access.workflow.checkOwnerAccess).toHaveBeenCalled();
      expect(mocks.workflow.getWorkflow).not.toHaveBeenCalled();
    });

    it('should throw if workflow is not found', async () => {
      const auth = factory.auth();
      const id = newUuid();

      mocks.access.workflow.checkOwnerAccess.mockResolvedValue(new Set([id]));
      mocks.workflow.getWorkflow.mockResolvedValue(undefined);

      await expect(sut.get(auth, id)).rejects.toThrow('Workflow not found');
    });

    it('should return the workflow', async () => {
      const auth = factory.auth();
      const workflow = makeWorkflow({ ownerId: auth.user.id });
      const filter = makeFilter({ workflowId: workflow.id });
      const action = makeAction({ workflowId: workflow.id });

      mocks.access.workflow.checkOwnerAccess.mockResolvedValue(new Set([workflow.id]));
      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);
      mocks.workflow.getFilters.mockResolvedValue([filter as any]);
      mocks.workflow.getActions.mockResolvedValue([action as any]);

      const result = await sut.get(auth, workflow.id);

      expect(result).toEqual({
        id: workflow.id,
        ownerId: workflow.ownerId,
        triggerType: PluginTriggerType.AssetCreate,
        name: 'Test Workflow',
        description: 'A test workflow',
        createdAt: workflow.createdAt.toISOString(),
        enabled: true,
        filters: [
          {
            id: filter.id,
            workflowId: filter.workflowId,
            pluginFilterId: filter.pluginFilterId,
            filterConfig: null,
            order: 0,
          },
        ],
        actions: [
          {
            id: action.id,
            workflowId: action.workflowId,
            pluginActionId: action.pluginActionId,
            actionConfig: null,
            order: 0,
          },
        ],
      });
    });
  });

  describe('update', () => {
    it('should require workflow.update access', async () => {
      const auth = factory.auth();
      const id = newUuid();

      await expect(sut.update(auth, id, { name: 'Updated' })).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.access.workflow.checkOwnerAccess).toHaveBeenCalled();
      expect(mocks.workflow.updateWorkflow).not.toHaveBeenCalled();
    });

    it('should throw when no fields to update', async () => {
      const auth = factory.auth();
      const id = newUuid();

      mocks.access.workflow.checkOwnerAccess.mockResolvedValue(new Set([id]));

      await expect(sut.update(auth, id, {})).rejects.toThrow('No fields to update');

      expect(mocks.workflow.updateWorkflow).not.toHaveBeenCalled();
    });

    it('should throw if workflow is not found', async () => {
      const auth = factory.auth();
      const id = newUuid();

      mocks.access.workflow.checkOwnerAccess.mockResolvedValue(new Set([id]));
      mocks.workflow.getWorkflow.mockResolvedValue(undefined);

      await expect(sut.update(auth, id, { name: 'Updated' })).rejects.toThrow('Workflow not found');
    });

    it('should update the workflow name', async () => {
      const auth = factory.auth();
      const workflow = makeWorkflow({ ownerId: auth.user.id });
      const updatedWorkflow = makeWorkflow({ ...workflow, name: 'Updated Name' });

      mocks.access.workflow.checkOwnerAccess.mockResolvedValue(new Set([workflow.id]));
      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);
      mocks.workflow.updateWorkflow.mockResolvedValue(updatedWorkflow as any);
      mocks.workflow.getFilters.mockResolvedValue([]);
      mocks.workflow.getActions.mockResolvedValue([]);

      const result = await sut.update(auth, workflow.id, { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(mocks.workflow.updateWorkflow).toHaveBeenCalledWith(
        workflow.id,
        { name: 'Updated Name' },
        undefined,
        undefined,
      );
    });

    it('should update the workflow description', async () => {
      const auth = factory.auth();
      const workflow = makeWorkflow({ ownerId: auth.user.id });
      const updatedWorkflow = makeWorkflow({ ...workflow, description: 'New description' });

      mocks.access.workflow.checkOwnerAccess.mockResolvedValue(new Set([workflow.id]));
      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);
      mocks.workflow.updateWorkflow.mockResolvedValue(updatedWorkflow as any);
      mocks.workflow.getFilters.mockResolvedValue([]);
      mocks.workflow.getActions.mockResolvedValue([]);

      const result = await sut.update(auth, workflow.id, { description: 'New description' });

      expect(result.description).toBe('New description');
    });

    it('should update the workflow enabled state', async () => {
      const auth = factory.auth();
      const workflow = makeWorkflow({ ownerId: auth.user.id, enabled: true });
      const updatedWorkflow = makeWorkflow({ ...workflow, enabled: false });

      mocks.access.workflow.checkOwnerAccess.mockResolvedValue(new Set([workflow.id]));
      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);
      mocks.workflow.updateWorkflow.mockResolvedValue(updatedWorkflow as any);
      mocks.workflow.getFilters.mockResolvedValue([]);
      mocks.workflow.getActions.mockResolvedValue([]);

      const result = await sut.update(auth, workflow.id, { enabled: false });

      expect(result.enabled).toBe(false);
    });

    it('should update workflow filters', async () => {
      const auth = factory.auth();
      const workflow = makeWorkflow({ ownerId: auth.user.id });
      const filterId = newUuid();
      const pluginFilter = makePluginFilter({ id: filterId });
      const updatedWorkflow = makeWorkflow({ ...workflow });

      mocks.access.workflow.checkOwnerAccess.mockResolvedValue(new Set([workflow.id]));
      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);
      mocks.plugin.getFilter.mockResolvedValue(pluginFilter as any);
      mocks.workflow.updateWorkflow.mockResolvedValue(updatedWorkflow as any);
      mocks.workflow.getFilters.mockResolvedValue([makeFilter({ workflowId: workflow.id, pluginFilterId: filterId }) as any]);
      mocks.workflow.getActions.mockResolvedValue([]);

      const result = await sut.update(auth, workflow.id, {
        filters: [{ pluginFilterId: filterId }],
      });

      expect(result.filters).toHaveLength(1);
      expect(mocks.workflow.updateWorkflow).toHaveBeenCalledWith(
        workflow.id,
        {},
        [{ pluginFilterId: filterId, filterConfig: null, order: 0 }],
        undefined,
      );
    });

    it('should update workflow actions', async () => {
      const auth = factory.auth();
      const workflow = makeWorkflow({ ownerId: auth.user.id });
      const actionId = newUuid();
      const pluginAction = makePluginAction({ id: actionId });
      const updatedWorkflow = makeWorkflow({ ...workflow });

      mocks.access.workflow.checkOwnerAccess.mockResolvedValue(new Set([workflow.id]));
      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);
      mocks.plugin.getAction.mockResolvedValue(pluginAction as any);
      mocks.workflow.updateWorkflow.mockResolvedValue(updatedWorkflow as any);
      mocks.workflow.getFilters.mockResolvedValue([]);
      mocks.workflow.getActions.mockResolvedValue([makeAction({ workflowId: workflow.id, pluginActionId: actionId }) as any]);

      const result = await sut.update(auth, workflow.id, {
        actions: [{ pluginActionId: actionId }],
      });

      expect(result.actions).toHaveLength(1);
      expect(mocks.workflow.updateWorkflow).toHaveBeenCalledWith(
        workflow.id,
        {},
        undefined,
        [{ pluginActionId: actionId, actionConfig: null, order: 0 }],
      );
    });

    it('should use the existing trigger type when not provided in the update', async () => {
      const auth = factory.auth();
      const workflow = makeWorkflow({
        ownerId: auth.user.id,
        triggerType: PluginTriggerType.PersonRecognized,
      });
      const actionId = newUuid();
      const pluginAction = makePluginAction({
        id: actionId,
        supportedContexts: [PluginContext.Person],
      });

      mocks.access.workflow.checkOwnerAccess.mockResolvedValue(new Set([workflow.id]));
      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);
      mocks.plugin.getAction.mockResolvedValue(pluginAction as any);
      mocks.workflow.updateWorkflow.mockResolvedValue(workflow as any);
      mocks.workflow.getFilters.mockResolvedValue([]);
      mocks.workflow.getActions.mockResolvedValue([]);

      await sut.update(auth, workflow.id, {
        actions: [{ pluginActionId: actionId }],
      });

      expect(mocks.plugin.getAction).toHaveBeenCalledWith(actionId);
    });

    it('should use the dto trigger type when provided in the update', async () => {
      const auth = factory.auth();
      const workflow = makeWorkflow({
        ownerId: auth.user.id,
        triggerType: PluginTriggerType.AssetCreate,
      });
      const actionId = newUuid();
      const pluginAction = makePluginAction({
        id: actionId,
        supportedContexts: [PluginContext.Person],
      });

      mocks.access.workflow.checkOwnerAccess.mockResolvedValue(new Set([workflow.id]));
      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);
      mocks.plugin.getAction.mockResolvedValue(pluginAction as any);
      mocks.workflow.updateWorkflow.mockResolvedValue({ ...workflow, triggerType: PluginTriggerType.PersonRecognized } as any);
      mocks.workflow.getFilters.mockResolvedValue([]);
      mocks.workflow.getActions.mockResolvedValue([]);

      await sut.update(auth, workflow.id, {
        triggerType: PluginTriggerType.PersonRecognized,
        actions: [{ pluginActionId: actionId }],
      });

      expect(mocks.workflow.updateWorkflow).toHaveBeenCalledWith(
        workflow.id,
        { triggerType: PluginTriggerType.PersonRecognized },
        undefined,
        [{ pluginActionId: actionId, actionConfig: null, order: 0 }],
      );
    });

    it('should throw for invalid filter ID during update', async () => {
      const auth = factory.auth();
      const workflow = makeWorkflow({ ownerId: auth.user.id });
      const invalidFilterId = newUuid();

      mocks.access.workflow.checkOwnerAccess.mockResolvedValue(new Set([workflow.id]));
      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);
      mocks.plugin.getFilter.mockResolvedValue(undefined);

      await expect(
        sut.update(auth, workflow.id, {
          filters: [{ pluginFilterId: invalidFilterId }],
        }),
      ).rejects.toThrow(`Invalid filter ID: ${invalidFilterId}`);

      expect(mocks.workflow.updateWorkflow).not.toHaveBeenCalled();
    });

    it('should throw for invalid action ID during update', async () => {
      const auth = factory.auth();
      const workflow = makeWorkflow({ ownerId: auth.user.id });
      const invalidActionId = newUuid();

      mocks.access.workflow.checkOwnerAccess.mockResolvedValue(new Set([workflow.id]));
      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);
      mocks.plugin.getAction.mockResolvedValue(undefined);

      await expect(
        sut.update(auth, workflow.id, {
          actions: [{ pluginActionId: invalidActionId }],
        }),
      ).rejects.toThrow(`Invalid action ID: ${invalidActionId}`);

      expect(mocks.workflow.updateWorkflow).not.toHaveBeenCalled();
    });

    it('should throw when filter context does not match trigger during update', async () => {
      const auth = factory.auth();
      const workflow = makeWorkflow({ ownerId: auth.user.id, triggerType: PluginTriggerType.AssetCreate });
      const filterId = newUuid();
      const pluginFilter = makePluginFilter({
        id: filterId,
        title: 'Person Filter',
        supportedContexts: [PluginContext.Person],
      });

      mocks.access.workflow.checkOwnerAccess.mockResolvedValue(new Set([workflow.id]));
      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);
      mocks.plugin.getFilter.mockResolvedValue(pluginFilter as any);

      await expect(
        sut.update(auth, workflow.id, {
          filters: [{ pluginFilterId: filterId }],
        }),
      ).rejects.toThrow('does not support asset context');

      expect(mocks.workflow.updateWorkflow).not.toHaveBeenCalled();
    });

    it('should throw when action context does not match trigger during update', async () => {
      const auth = factory.auth();
      const workflow = makeWorkflow({ ownerId: auth.user.id, triggerType: PluginTriggerType.AssetCreate });
      const actionId = newUuid();
      const pluginAction = makePluginAction({
        id: actionId,
        title: 'Person Action',
        supportedContexts: [PluginContext.Person],
      });

      mocks.access.workflow.checkOwnerAccess.mockResolvedValue(new Set([workflow.id]));
      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);
      mocks.plugin.getAction.mockResolvedValue(pluginAction as any);

      await expect(
        sut.update(auth, workflow.id, {
          actions: [{ pluginActionId: actionId }],
        }),
      ).rejects.toThrow('does not support asset context');

      expect(mocks.workflow.updateWorkflow).not.toHaveBeenCalled();
    });

    it('should throw for invalid trigger type during update', async () => {
      const auth = factory.auth();
      const workflow = makeWorkflow({ ownerId: auth.user.id });

      mocks.access.workflow.checkOwnerAccess.mockResolvedValue(new Set([workflow.id]));
      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);

      await expect(
        sut.update(auth, workflow.id, {
          triggerType: 'InvalidTrigger' as PluginTriggerType,
        }),
      ).rejects.toThrow('Invalid trigger type: InvalidTrigger');

      expect(mocks.workflow.updateWorkflow).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should require workflow.delete access', async () => {
      const auth = factory.auth();
      const id = newUuid();

      await expect(sut.delete(auth, id)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.access.workflow.checkOwnerAccess).toHaveBeenCalled();
      expect(mocks.workflow.deleteWorkflow).not.toHaveBeenCalled();
    });

    it('should delete the workflow', async () => {
      const auth = factory.auth();
      const id = newUuid();

      mocks.access.workflow.checkOwnerAccess.mockResolvedValue(new Set([id]));
      mocks.workflow.deleteWorkflow.mockResolvedValue(undefined);

      await sut.delete(auth, id);

      expect(mocks.workflow.deleteWorkflow).toHaveBeenCalledWith(id);
    });
  });
});
