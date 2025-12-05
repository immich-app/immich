import { goto } from '$app/navigation';
import { AppRoute } from '$lib/constants';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import {
  createWorkflow,
  deleteWorkflow,
  getAlbumInfo,
  getPerson,
  PluginTriggerType,
  updateWorkflow,
  type AlbumResponseDto,
  type PersonResponseDto,
  type PluginActionResponseDto,
  type PluginContextType,
  type PluginFilterResponseDto,
  type PluginTriggerResponseDto,
  type WorkflowActionItemDto,
  type WorkflowFilterItemDto,
  type WorkflowResponseDto,
  type WorkflowUpdateDto,
} from '@immich/sdk';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import { mdiCodeJson, mdiDelete, mdiPause, mdiPencil, mdiPlay } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';

export type PickerSubType = 'album-picker' | 'people-picker';
export type PickerMetadata = AlbumResponseDto | PersonResponseDto | AlbumResponseDto[] | PersonResponseDto[];

export interface WorkflowPayload {
  name: string;
  description: string;
  enabled: boolean;
  triggerType: string;
  filters: Record<string, unknown>[];
  actions: Record<string, unknown>[];
}

/**
 * Get filters that support the given context
 */
export const getFiltersByContext = (
  availableFilters: PluginFilterResponseDto[],
  context: PluginContextType,
): PluginFilterResponseDto[] => {
  return availableFilters.filter((filter) => filter.supportedContexts.includes(context));
};

/**
 * Get actions that support the given context
 */
export const getActionsByContext = (
  availableActions: PluginActionResponseDto[],
  context: PluginContextType,
): PluginActionResponseDto[] => {
  return availableActions.filter((action) => action.supportedContexts.includes(context));
};

/**
 * Initialize filter configurations from existing workflow
 */
export const initializeFilterConfigs = (
  workflow: WorkflowResponseDto,
  availableFilters: PluginFilterResponseDto[],
): Record<string, unknown> => {
  const configs: Record<string, unknown> = {};

  if (workflow.filters) {
    for (const workflowFilter of workflow.filters) {
      const filterDef = availableFilters.find((f) => f.id === workflowFilter.pluginFilterId);
      if (filterDef) {
        configs[filterDef.methodName] = workflowFilter.filterConfig ?? {};
      }
    }
  }

  return configs;
};

/**
 * Initialize action configurations from existing workflow
 */
export const initializeActionConfigs = (
  workflow: WorkflowResponseDto,
  availableActions: PluginActionResponseDto[],
): Record<string, unknown> => {
  const configs: Record<string, unknown> = {};

  if (workflow.actions) {
    for (const workflowAction of workflow.actions) {
      const actionDef = availableActions.find((a) => a.id === workflowAction.pluginActionId);
      if (actionDef) {
        configs[actionDef.methodName] = workflowAction.actionConfig ?? {};
      }
    }
  }

  return configs;
};

/**
 * Build workflow payload from current state
 */
export const buildWorkflowPayload = (
  name: string,
  description: string,
  enabled: boolean,
  triggerType: string,
  orderedFilters: PluginFilterResponseDto[],
  orderedActions: PluginActionResponseDto[],
  filterConfigs: Record<string, unknown>,
  actionConfigs: Record<string, unknown>,
): WorkflowPayload => {
  const filters = orderedFilters.map((filter) => ({
    [filter.methodName]: filterConfigs[filter.methodName] ?? {},
  }));

  const actions = orderedActions.map((action) => ({
    [action.methodName]: actionConfigs[action.methodName] ?? {},
  }));

  return {
    name,
    description,
    enabled,
    triggerType,
    filters,
    actions,
  };
};

/**
 * Parse JSON workflow and update state
 */
export const parseWorkflowJson = (
  jsonString: string,
  availableTriggers: PluginTriggerResponseDto[],
  availableFilters: PluginFilterResponseDto[],
  availableActions: PluginActionResponseDto[],
): {
  success: boolean;
  error?: string;
  data?: {
    name: string;
    description: string;
    enabled: boolean;
    trigger?: PluginTriggerResponseDto;
    filters: PluginFilterResponseDto[];
    actions: PluginActionResponseDto[];
    filterConfigs: Record<string, unknown>;
    actionConfigs: Record<string, unknown>;
  };
} => {
  try {
    const parsed = JSON.parse(jsonString);

    // Find trigger
    const trigger = availableTriggers.find((t) => t.type === parsed.triggerType);

    // Parse filters
    const filters: PluginFilterResponseDto[] = [];
    const filterConfigs: Record<string, unknown> = {};
    if (Array.isArray(parsed.filters)) {
      for (const filterObj of parsed.filters) {
        const methodName = Object.keys(filterObj)[0];
        const filter = availableFilters.find((f) => f.methodName === methodName);
        if (filter) {
          filters.push(filter);
          filterConfigs[methodName] = (filterObj as Record<string, unknown>)[methodName];
        }
      }
    }

    // Parse actions
    const actions: PluginActionResponseDto[] = [];
    const actionConfigs: Record<string, unknown> = {};
    if (Array.isArray(parsed.actions)) {
      for (const actionObj of parsed.actions) {
        const methodName = Object.keys(actionObj)[0];
        const action = availableActions.find((a) => a.methodName === methodName);
        if (action) {
          actions.push(action);
          actionConfigs[methodName] = (actionObj as Record<string, unknown>)[methodName];
        }
      }
    }

    return {
      success: true,
      data: {
        name: parsed.name ?? '',
        description: parsed.description ?? '',
        enabled: parsed.enabled ?? false,
        trigger,
        filters,
        actions,
        filterConfigs,
        actionConfigs,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid JSON',
    };
  }
};

/**
 * Check if workflow has changes compared to previous version
 */
export const hasWorkflowChanged = (
  previousWorkflow: WorkflowResponseDto,
  enabled: boolean,
  name: string,
  description: string,
  triggerType: string,
  orderedFilters: PluginFilterResponseDto[],
  orderedActions: PluginActionResponseDto[],
  filterConfigs: Record<string, unknown>,
  actionConfigs: Record<string, unknown>,
  availableFilters: PluginFilterResponseDto[],
  availableActions: PluginActionResponseDto[],
): boolean => {
  // Check enabled state
  if (enabled !== previousWorkflow.enabled) {
    return true;
  }

  // Check name or description
  if (name !== (previousWorkflow.name ?? '') || description !== (previousWorkflow.description ?? '')) {
    return true;
  }

  // Check trigger
  if (triggerType !== previousWorkflow.triggerType) {
    return true;
  }

  // Check filters order/items
  const previousFilterIds = previousWorkflow.filters?.map((f) => f.pluginFilterId) ?? [];
  const currentFilterIds = orderedFilters.map((f) => f.id);
  if (JSON.stringify(previousFilterIds) !== JSON.stringify(currentFilterIds)) {
    return true;
  }

  // Check actions order/items
  const previousActionIds = previousWorkflow.actions?.map((a) => a.pluginActionId) ?? [];
  const currentActionIds = orderedActions.map((a) => a.id);
  if (JSON.stringify(previousActionIds) !== JSON.stringify(currentActionIds)) {
    return true;
  }

  // Check filter configs
  const previousFilterConfigs: Record<string, unknown> = {};
  for (const wf of previousWorkflow.filters ?? []) {
    const filterDef = availableFilters.find((f) => f.id === wf.pluginFilterId);
    if (filterDef) {
      previousFilterConfigs[filterDef.methodName] = wf.filterConfig ?? {};
    }
  }
  if (JSON.stringify(previousFilterConfigs) !== JSON.stringify(filterConfigs)) {
    return true;
  }

  // Check action configs
  const previousActionConfigs: Record<string, unknown> = {};
  for (const wa of previousWorkflow.actions ?? []) {
    const actionDef = availableActions.find((a) => a.id === wa.pluginActionId);
    if (actionDef) {
      previousActionConfigs[actionDef.methodName] = wa.actionConfig ?? {};
    }
  }
  if (JSON.stringify(previousActionConfigs) !== JSON.stringify(actionConfigs)) {
    return true;
  }

  return false;
};

/**
 * Update a workflow via API
 */
export const handleUpdateWorkflow = async (
  workflowId: string,
  name: string,
  description: string,
  enabled: boolean,
  triggerType: PluginTriggerType,
  orderedFilters: PluginFilterResponseDto[],
  orderedActions: PluginActionResponseDto[],
  filterConfigs: Record<string, unknown>,
  actionConfigs: Record<string, unknown>,
): Promise<WorkflowResponseDto> => {
  const filters = orderedFilters.map((filter) => ({
    pluginFilterId: filter.id,
    filterConfig: filterConfigs[filter.methodName] ?? {},
  })) as WorkflowFilterItemDto[];

  const actions = orderedActions.map((action) => ({
    pluginActionId: action.id,
    actionConfig: actionConfigs[action.methodName] ?? {},
  })) as WorkflowActionItemDto[];

  const updateDto: WorkflowUpdateDto = {
    name,
    description,
    enabled,
    filters,
    actions,
    triggerType,
  };

  return updateWorkflow({ id: workflowId, workflowUpdateDto: updateDto });
};

export const getWorkflowActions = ($t: MessageFormatter, workflow: WorkflowResponseDto) => {
  const ToggleEnabled: ActionItem = {
    title: workflow.enabled ? $t('disable') : $t('enable'),
    icon: workflow.enabled ? mdiPause : mdiPlay,
    color: workflow.enabled ? 'danger' : 'primary',
    onAction: async () => {
      await handleToggleWorkflowEnabled(workflow);
    },
  };

  const Edit: ActionItem = {
    title: $t('edit'),
    icon: mdiPencil,
    onAction: () => handleNavigateToWorkflow(workflow),
  };

  const Delete: ActionItem = {
    title: $t('delete'),
    icon: mdiDelete,
    color: 'danger',
    onAction: async () => {
      await handleDeleteWorkflow(workflow);
    },
  };

  return { ToggleEnabled, Edit, Delete };
};

export const getWorkflowShowSchemaAction = (
  $t: MessageFormatter,
  isExpanded: boolean,
  onToggle: () => void,
): ActionItem => ({
  title: isExpanded ? $t('hide_schema') : $t('show_schema'),
  icon: mdiCodeJson,
  onAction: onToggle,
});

export const handleCreateWorkflow = async (): Promise<WorkflowResponseDto | undefined> => {
  const $t = await getFormatter();

  try {
    const workflow = await createWorkflow({
      workflowCreateDto: {
        name: $t('untitled_workflow'),
        triggerType: PluginTriggerType.AssetCreate,
        filters: [],
        actions: [],
        enabled: false,
      },
    });

    await goto(`${AppRoute.WORKFLOWS}/${workflow.id}`);
    return workflow;
  } catch (error) {
    handleError(error, $t('errors.unable_to_create'));
  }
};

export const handleToggleWorkflowEnabled = async (
  workflow: WorkflowResponseDto,
): Promise<WorkflowResponseDto | undefined> => {
  const $t = await getFormatter();

  try {
    const updated = await updateWorkflow({
      id: workflow.id,
      workflowUpdateDto: { enabled: !workflow.enabled },
    });

    eventManager.emit('WorkflowUpdate', updated);
    toastManager.success($t('workflow_updated'));
    return updated;
  } catch (error) {
    handleError(error, $t('errors.unable_to_update_workflow'));
  }
};

export const handleDeleteWorkflow = async (workflow: WorkflowResponseDto): Promise<boolean> => {
  const $t = await getFormatter();

  const confirmed = await modalManager.showDialog({
    prompt: $t('workflow_delete_prompt'),
    confirmColor: 'danger',
  });

  if (!confirmed) {
    return false;
  }

  try {
    await deleteWorkflow({ id: workflow.id });
    eventManager.emit('WorkflowDelete', workflow);
    toastManager.success($t('workflow_deleted'));
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_delete_workflow'));
    return false;
  }
};

export const handleNavigateToWorkflow = async (workflow: WorkflowResponseDto): Promise<void> => {
  await goto(`${AppRoute.WORKFLOWS}/${workflow.id}`);
};

export const fetchPickerMetadata = async (
  value: string | string[] | undefined,
  subType: PickerSubType,
): Promise<PickerMetadata | undefined> => {
  if (!value) {
    return undefined;
  }

  const isAlbum = subType === 'album-picker';

  try {
    if (Array.isArray(value) && value.length > 0) {
      // Multiple selection
      return isAlbum
        ? await Promise.all(value.map((id) => getAlbumInfo({ id })))
        : await Promise.all(value.map((id) => getPerson({ id })));
    } else if (typeof value === 'string' && value) {
      // Single selection
      return isAlbum ? await getAlbumInfo({ id: value }) : await getPerson({ id: value });
    }
  } catch (error) {
    console.error(`Failed to fetch picker metadata:`, error);
  }

  return undefined;
};
