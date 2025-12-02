import {
  PluginTriggerType,
  updateWorkflow as updateWorkflowApi,
  type PluginActionResponseDto,
  type PluginContextType,
  type PluginFilterResponseDto,
  type PluginTriggerResponseDto,
  type WorkflowActionItemDto,
  type WorkflowFilterItemDto,
  type WorkflowResponseDto,
  type WorkflowUpdateDto,
} from '@immich/sdk';

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

  return updateWorkflowApi({ id: workflowId, workflowUpdateDto: updateDto });
};
