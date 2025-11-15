<script lang="ts">
  import { type PluginResponseDto, PluginContext } from '@immich/sdk';
  import { Button, Field, Icon, IconButton } from '@immich/ui';
  import { mdiChevronDown, mdiChevronUp, mdiClose, mdiPlus } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import SchemaFormFields from './schema-form/SchemaFormFields.svelte';

  interface Props {
    filters: Array<{ filterId: string; filterConfig?: object }>;
    triggerType: 'AssetCreate' | 'PersonRecognized';
    plugins: PluginResponseDto[];
  }

  let { filters = $bindable([]), triggerType, plugins }: Props = $props();

  // Map trigger type to context
  const getTriggerContext = (trigger: string): PluginContext => {
    const contextMap: Record<string, PluginContext> = {
      AssetCreate: PluginContext.Asset,
      PersonRecognized: PluginContext.Person,
    };
    return contextMap[trigger] || PluginContext.Asset;
  };

  const triggerContext = $derived(getTriggerContext(triggerType));

  // Get all available filters that match the trigger context
  const availableFilters = $derived(
    plugins.flatMap((plugin) => plugin.filters.filter((filter) => filter.supportedContexts.includes(triggerContext))),
  );

  const addFilter = () => {
    if (availableFilters.length > 0) {
      filters = [...filters, { filterId: availableFilters[0].id, filterConfig: {} }];
    }
  };

  const removeFilter = (index: number) => {
    filters = filters.filter((_, i) => i !== index);
  };

  const moveUp = (index: number) => {
    if (index > 0) {
      const newFilters = [...filters];
      [newFilters[index - 1], newFilters[index]] = [newFilters[index], newFilters[index - 1]];
      filters = newFilters;
    }
  };

  const moveDown = (index: number) => {
    if (index < filters.length - 1) {
      const newFilters = [...filters];
      [newFilters[index], newFilters[index + 1]] = [newFilters[index + 1], newFilters[index]];
      filters = newFilters;
    }
  };

  const getFilterById = (filterId: string) => {
    for (const plugin of plugins) {
      const filter = plugin.filters.find((f) => f.id === filterId);
      if (filter) {
        return filter;
      }
    }
    return null;
  };
</script>

{#if filters.length === 0}
  <div
    class="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400"
  >
    {$t('no_filters_added')}
  </div>
{:else}
  <div class="flex flex-col gap-3">
    {#each filters as filter, index (index)}
      {@const filterDef = getFilterById(filter.filterId)}
      <div class="rounded-lg border border-gray-300 p-3 dark:border-gray-700">
        <div class="mb-2 flex items-center justify-between">
          <div class="flex-1">
            <Field label={$t('filter')}>
              <select
                bind:value={filter.filterId}
                class="immich-form-input w-full"
                onchange={() => {
                  filter.filterConfig = {};
                }}
              >
                {#each availableFilters as availFilter (availFilter.id)}
                  <option value={availFilter.id}>{availFilter.title}</option>
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
              disabled={index === filters.length - 1}
              size="small"
            />
            <IconButton
              shape="round"
              color="secondary"
              icon={mdiClose}
              aria-label={$t('remove')}
              onclick={() => removeFilter(index)}
              size="small"
            />
          </div>
        </div>

        {#if filterDef}
          <div class="text-xs text-gray-600 dark:text-gray-400 mb-2">
            {filterDef.description}
          </div>
          {#if filterDef.schema}
            <SchemaFormFields schema={filterDef.schema} bind:config={filter.filterConfig} />
          {/if}
        {/if}
      </div>
    {/each}
  </div>
{/if}

<Button shape="round" size="small" onclick={addFilter} disabled={availableFilters.length === 0} class="mt-2">
  <Icon icon={mdiPlus} size="18" />
  {$t('add_filter')}
</Button>
