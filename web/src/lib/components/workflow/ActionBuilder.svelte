<script lang="ts">
  import { type PluginResponseDto, PluginContext } from '@immich/sdk';
  import { Button, Field, Icon, IconButton } from '@immich/ui';
  import { mdiChevronDown, mdiChevronUp, mdiClose, mdiPlus } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import SchemaFormFields from './schema-form/SchemaFormFields.svelte';

  interface Props {
    actions: Array<{ actionId: string; actionConfig?: object }>;
    triggerType: 'AssetCreate' | 'PersonRecognized';
    plugins: PluginResponseDto[];
  }

  let { actions = $bindable([]), triggerType, plugins }: Props = $props();

  // Map trigger type to context
  const getTriggerContext = (trigger: string): PluginContext => {
    const contextMap: Record<string, PluginContext> = {
      AssetCreate: PluginContext.Asset,
      PersonRecognized: PluginContext.Person,
    };
    return contextMap[trigger] || PluginContext.Asset;
  };

  const triggerContext = $derived(getTriggerContext(triggerType));

  // Get all available actions that match the trigger context
  const availableActions = $derived(
    plugins.flatMap((plugin) => plugin.actions.filter((action) => action.supportedContexts.includes(triggerContext))),
  );

  const addAction = () => {
    if (availableActions.length > 0) {
      actions = [...actions, { actionId: availableActions[0].id, actionConfig: {} }];
    }
  };

  const removeAction = (index: number) => {
    actions = actions.filter((_, i) => i !== index);
  };

  const moveUp = (index: number) => {
    if (index > 0) {
      const newActions = [...actions];
      [newActions[index - 1], newActions[index]] = [newActions[index], newActions[index - 1]];
      actions = newActions;
    }
  };

  const moveDown = (index: number) => {
    if (index < actions.length - 1) {
      const newActions = [...actions];
      [newActions[index], newActions[index + 1]] = [newActions[index + 1], newActions[index]];
      actions = newActions;
    }
  };

  const getActionById = (actionId: string) => {
    for (const plugin of plugins) {
      const action = plugin.actions.find((a) => a.id === actionId);
      if (action) {
        return action;
      }
    }
    return null;
  };
</script>

{#if actions.length === 0}
  <div
    class="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400"
  >
    {$t('no_actions_added')}
  </div>
{:else}
  <div class="flex flex-col gap-3">
    {#each actions as action, index (index)}
      {@const actionDef = getActionById(action.actionId)}
      <div class="rounded-lg border border-gray-300 p-3 dark:border-gray-700">
        <div class="mb-2 flex items-center justify-between">
          <div class="flex-1">
            <Field label={$t('action')}>
              <select
                bind:value={action.actionId}
                class="immich-form-input w-full"
                onchange={() => {
                  action.actionConfig = {};
                }}
              >
                {#each availableActions as availAction (availAction.id)}
                  <option value={availAction.id}>{availAction.title}</option>
                {/each}
              </select>
            </Field>
          </div>
          <div class="ml-2 flex gap-1">
            <IconButton
              shape="round"
              color="secondary"
              icon={mdiChevronUp}
              aria-label={$t('move_up')}
              onclick={() => moveUp(index)}
              disabled={index === 0}
              size="small"
            />
            <IconButton
              shape="round"
              color="secondary"
              icon={mdiChevronDown}
              aria-label={$t('move_down')}
              onclick={() => moveDown(index)}
              disabled={index === actions.length - 1}
              size="small"
            />
            <IconButton
              shape="round"
              color="secondary"
              icon={mdiClose}
              aria-label={$t('remove')}
              onclick={() => removeAction(index)}
              size="small"
            />
          </div>
        </div>

        {#if actionDef}
          <div class="text-xs text-gray-600 dark:text-gray-400 mb-2">
            {actionDef.description}
          </div>
          {#if actionDef.schema}
            <SchemaFormFields schema={actionDef.schema} bind:config={action.actionConfig} />
          {/if}
        {/if}
      </div>
    {/each}
  </div>
{/if}

<Button shape="round" size="small" onclick={addAction} disabled={availableActions.length === 0} class="mt-2">
  <Icon icon={mdiPlus} size="18" />
  {$t('add_action')}
</Button>
