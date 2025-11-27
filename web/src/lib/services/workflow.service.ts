import {
  PluginTriggerType,
  updateWorkflow as updateWorkflowApi,
  type PluginActionResponseDto,
  type PluginContext,
  type PluginFilterResponseDto,
  type PluginTriggerResponseDto,
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

export class WorkflowService {
  private availableTriggers: PluginTriggerResponseDto[];
  private availableFilters: PluginFilterResponseDto[];
  private availableActions: PluginActionResponseDto[];

  constructor(
    triggers: PluginTriggerResponseDto[],
    filters: PluginFilterResponseDto[],
    actions: PluginActionResponseDto[],
  ) {
    this.availableTriggers = triggers;
    this.availableFilters = filters;
    this.availableActions = actions;
  }

  /**
   * Get filters that support the given context
   */
  getFiltersByContext(context: PluginContext): PluginFilterResponseDto[] {
    return this.availableFilters.filter((filter) => filter.supportedContexts.includes(context));
  }

  /**
   * Get actions that support the given context
   */
  getActionsByContext(context: PluginContext): PluginActionResponseDto[] {
    return this.availableActions.filter((action) => action.supportedContexts.includes(context));
  }

  /**
   * Initialize filter configurations from existing workflow
   */
  initializeFilterConfigs(
    workflow: WorkflowResponseDto,
    contextFilters?: PluginFilterResponseDto[],
  ): Record<string, unknown> {
    const filters = contextFilters ?? this.availableFilters;
    const configs: Record<string, unknown> = {};

    if (workflow.filters) {
      for (const workflowFilter of workflow.filters) {
        const filterDef = filters.find((f) => f.id === workflowFilter.filterId);
        if (filterDef) {
          configs[filterDef.methodName] = workflowFilter.filterConfig ?? {};
        }
      }
    }

    return configs;
  }

  /**
   * Initialize action configurations from existing workflow
   */
  initializeActionConfigs(
    workflow: WorkflowResponseDto,
    contextActions?: PluginActionResponseDto[],
  ): Record<string, unknown> {
    const actions = contextActions ?? this.availableActions;
    const configs: Record<string, unknown> = {};

    if (workflow.actions) {
      for (const workflowAction of workflow.actions) {
        const actionDef = actions.find((a) => a.id === workflowAction.actionId);
        if (actionDef) {
          configs[actionDef.methodName] = workflowAction.actionConfig ?? {};
        }
      }
    }

    return configs;
  }

  /**
   * Initialize ordered filters from existing workflow
   */
  initializeOrderedFilters(
    workflow: WorkflowResponseDto,
    contextFilters?: PluginFilterResponseDto[],
  ): PluginFilterResponseDto[] {
    if (!workflow.filters) {
      return [];
    }

    const filters = contextFilters ?? this.availableFilters;
    return workflow.filters
      .map((wf) => filters.find((f) => f.id === wf.filterId))
      .filter(Boolean) as PluginFilterResponseDto[];
  }

  /**
   * Initialize ordered actions from existing workflow
   */
  initializeOrderedActions(
    workflow: WorkflowResponseDto,
    contextActions?: PluginActionResponseDto[],
  ): PluginActionResponseDto[] {
    if (!workflow.actions) {
      return [];
    }

    const actions = contextActions ?? this.availableActions;
    return workflow.actions
      .map((wa) => actions.find((a) => a.id === wa.actionId))
      .filter(Boolean) as PluginActionResponseDto[];
  }

  /**
   * Build workflow payload from current state
   */
  buildWorkflowPayload(
    name: string,
    description: string,
    enabled: boolean,
    triggerType: string,
    orderedFilters: PluginFilterResponseDto[],
    orderedActions: PluginActionResponseDto[],
    filterConfigs: Record<string, unknown>,
    actionConfigs: Record<string, unknown>,
  ): WorkflowPayload {
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
  }

  /**
   * Parse JSON workflow and update state
   */
  parseWorkflowJson(jsonString: string): {
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
  } {
    try {
      const parsed = JSON.parse(jsonString);

      // Find trigger
      const trigger = this.availableTriggers.find((t) => t.triggerType === parsed.triggerType);

      // Parse filters
      const filters: PluginFilterResponseDto[] = [];
      const filterConfigs: Record<string, unknown> = {};
      if (Array.isArray(parsed.filters)) {
        for (const filterObj of parsed.filters) {
          const methodName = Object.keys(filterObj)[0];
          const filter = this.availableFilters.find((f) => f.methodName === methodName);
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
          const action = this.availableActions.find((a) => a.methodName === methodName);
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
  }

  /**
   * Check if workflow has changes compared to previous version
   */
  hasWorkflowChanged(
    previousWorkflow: WorkflowResponseDto,
    enabled: boolean,
    name: string,
    description: string,
    triggerType: string,
    orderedFilters: PluginFilterResponseDto[],
    orderedActions: PluginActionResponseDto[],
    filterConfigs: Record<string, unknown>,
    actionConfigs: Record<string, unknown>,
  ): boolean {
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
    const previousFilterIds = previousWorkflow.filters?.map((f) => f.filterId) ?? [];
    const currentFilterIds = orderedFilters.map((f) => f.id);
    if (JSON.stringify(previousFilterIds) !== JSON.stringify(currentFilterIds)) {
      return true;
    }

    // Check actions order/items
    const previousActionIds = previousWorkflow.actions?.map((a) => a.actionId) ?? [];
    const currentActionIds = orderedActions.map((a) => a.id);
    if (JSON.stringify(previousActionIds) !== JSON.stringify(currentActionIds)) {
      return true;
    }

    // Check filter configs
    const previousFilterConfigs: Record<string, unknown> = {};
    for (const wf of previousWorkflow.filters ?? []) {
      const filterDef = this.availableFilters.find((f) => f.id === wf.filterId);
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
      const actionDef = this.availableActions.find((a) => a.id === wa.actionId);
      if (actionDef) {
        previousActionConfigs[actionDef.methodName] = wa.actionConfig ?? {};
      }
    }
    if (JSON.stringify(previousActionConfigs) !== JSON.stringify(actionConfigs)) {
      return true;
    }

    return false;
  }

  async updateWorkflow(
    workflowId: string,
    name: string,
    description: string,
    enabled: boolean,
    triggerType: PluginTriggerType,
    orderedFilters: PluginFilterResponseDto[],
    orderedActions: PluginActionResponseDto[],
    filterConfigs: Record<string, unknown>,
    actionConfigs: Record<string, unknown>,
  ): Promise<WorkflowResponseDto> {
    const filters = orderedFilters.map((filter) => ({
      filterId: filter.id,
      filterConfig: filterConfigs[filter.methodName] ?? {},
    }));

    const actions = orderedActions.map((action) => ({
      actionId: action.id,
      actionConfig: actionConfigs[action.methodName] ?? {},
    }));

    const updateDto: WorkflowUpdateDto = {
      name,
      description,
      enabled,
      filters,
      actions,
      triggerType,
    };

    return updateWorkflowApi({ id: workflowId, workflowUpdateDto: updateDto });
  }
}
