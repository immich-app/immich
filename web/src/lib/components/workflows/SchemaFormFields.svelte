<script lang="ts">
  import { getComponentDefaultValue, getComponentFromSchema } from '$lib/utils/workflow';
  import { Field, Input, MultiSelect, Select, Switch, Text } from '@immich/ui';
  import WorkflowPickerField from './WorkflowPickerField.svelte';

  type Props = {
    schema: object | null;
    config: Record<string, unknown>;
    configKey?: string;
  };

  let { schema = null, config = $bindable({}), configKey }: Props = $props();

  const components = $derived(getComponentFromSchema(schema));

  // Get the actual config object to work with
  const actualConfig = $derived(configKey ? (config[configKey] as Record<string, unknown>) || {} : config);

  // Update function that handles nested config
  const updateConfig = (key: string, value: unknown) => {
    config = configKey ? { ...config, [configKey]: { ...actualConfig, [key]: value } } : { ...config, [key]: value };
  };

  const updateConfigBatch = (updates: Record<string, unknown>) => {
    config = configKey ? { ...config, [configKey]: { ...actualConfig, ...updates } } : { ...config, ...updates };
  };

  // Derive which keys need initialization (missing from actualConfig)
  const uninitializedKeys = $derived.by(() => {
    if (!components) {
      return [];
    }

    return Object.entries(components)
      .filter(([key]) => actualConfig[key] === undefined)
      .map(([key, component]) => ({ key, component, defaultValue: getComponentDefaultValue(component) }));
  });

  // Derive the batch updates needed
  const pendingUpdates = $derived.by(() => {
    const updates: Record<string, unknown> = {};
    for (const { key, defaultValue } of uninitializedKeys) {
      updates[key] = defaultValue;
    }
    return updates;
  });

  // Initialize config namespace if needed
  $effect(() => {
    if (configKey && !config[configKey]) {
      config = { ...config, [configKey]: {} };
    }
  });

  // Apply pending config updates
  $effect(() => {
    if (Object.keys(pendingUpdates).length > 0) {
      updateConfigBatch(pendingUpdates);
    }
  });

  const isPickerField = (subType: string | undefined) => subType === 'album-picker' || subType === 'people-picker';
</script>

{#if components}
  <div class="flex flex-col gap-2">
    {#each Object.entries(components) as [key, component] (key)}
      {@const label = component.title || component.label || key}

      <div class="flex flex-col gap-1 border bg-light p-4 rounded-xl">
        <!-- Select component -->
        {#if component.type === 'select'}
          {#if isPickerField(component.subType)}
            <WorkflowPickerField
              {component}
              configKey={key}
              value={actualConfig[key] as string | string[]}
              onchange={(value) => updateConfig(key, value)}
            />
          {:else}
            {@const options = component.options?.map((opt) => {
              return { label: opt.label, value: String(opt.value) };
            }) || [{ label: 'N/A', value: '' }]}
            {@const currentValue = actualConfig[key]}
            {@const selectedItem = options.find((opt) => opt.value === String(currentValue)) ?? options[0]}

            <Field
              {label}
              required={component.required}
              description={component.description}
              requiredIndicator={component.required}
            >
              <Select data={options} onChange={(opt) => updateConfig(key, opt.value)} value={selectedItem} />
            </Field>
          {/if}

          <!-- MultiSelect component -->
        {:else if component.type === 'multiselect'}
          {#if isPickerField(component.subType)}
            <WorkflowPickerField
              {component}
              configKey={key}
              value={actualConfig[key] as string | string[]}
              onchange={(value) => updateConfig(key, value)}
            />
          {:else}
            {@const options = component.options?.map((opt) => {
              return { label: opt.label, value: String(opt.value) };
            }) || [{ label: 'N/A', value: '' }]}
            {@const currentValues = (actualConfig[key] as string[]) ?? []}
            {@const selectedItems = options.filter((opt) => currentValues.includes(opt.value))}

            <Field
              {label}
              required={component.required}
              description={component.description}
              requiredIndicator={component.required}
            >
              <MultiSelect
                data={options}
                onChange={(opt) =>
                  updateConfig(
                    key,
                    opt.map((o) => o.value),
                  )}
                values={selectedItems}
              />
            </Field>
          {/if}

          <!-- Switch component -->
        {:else if component.type === 'switch'}
          {@const checked = Boolean(actualConfig[key])}
          <Field
            {label}
            description={component.description}
            requiredIndicator={component.required}
            required={component.required}
          >
            <Switch {checked} onCheckedChange={(check) => updateConfig(key, check)} />
          </Field>

          <!-- Text input -->
        {:else if isPickerField(component.subType)}
          <WorkflowPickerField
            {component}
            configKey={key}
            value={actualConfig[key] as string | string[]}
            onchange={(value) => updateConfig(key, value)}
          />
        {:else}
          <Field
            {label}
            description={component.description}
            requiredIndicator={component.required}
            required={component.required}
          >
            <Input
              id={key}
              value={actualConfig[key] as string}
              oninput={(e) => updateConfig(key, e.currentTarget.value)}
              required={component.required}
            />
          </Field>
        {/if}
      </div>
    {/each}
  </div>
{:else}
  <Text size="small" color="muted">No configuration required</Text>
{/if}
