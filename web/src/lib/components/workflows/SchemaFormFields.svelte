<script lang="ts">
  import { formatLabel, getComponentFromSchema } from '$lib/utils/workflow';
  import { Field, Input, MultiSelect, Select, Switch, Text, type SelectItem } from '@immich/ui';
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

  let selectValue = $state<SelectItem>();
  let switchValue = $state<boolean>(false);
  let multiSelectValue = $state<SelectItem[]>([]);

  $effect(() => {
    // Initialize config for actions/filters with empty schemas
    if (configKey && !config[configKey]) {
      config = { ...config, [configKey]: {} };
    }

    if (components) {
      const updates: Record<string, unknown> = {};

      for (const [key, component] of Object.entries(components)) {
        // Only initialize if the key doesn't exist in config yet
        if (actualConfig[key] === undefined) {
          // Use default value if available, otherwise use appropriate empty value based on type
          const hasDefault = component.defaultValue !== undefined;

          if (hasDefault) {
            updates[key] = component.defaultValue;
          } else {
            // Initialize with appropriate empty value based on component type
            if (
              component.type === 'multiselect' ||
              (component.type === 'text' && component.subType === 'people-picker')
            ) {
              updates[key] = [];
            } else if (component.type === 'switch') {
              updates[key] = false;
            } else {
              updates[key] = '';
            }
          }

          // Update UI state for components with default values
          if (hasDefault) {
            if (component.type === 'select') {
              selectValue = {
                label: formatLabel(String(component.defaultValue)),
                value: String(component.defaultValue),
              };
            }

            if (component.type === 'switch') {
              switchValue = Boolean(component.defaultValue);
            }
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        updateConfigBatch(updates);
      }
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

            <Field
              {label}
              required={component.required}
              description={component.description}
              requiredIndicator={component.required}
            >
              <Select data={options} onChange={(opt) => updateConfig(key, opt.value)} bind:value={selectValue} />
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
                bind:values={multiSelectValue}
              />
            </Field>
          {/if}

          <!-- Switch component -->
        {:else if component.type === 'switch'}
          <Field
            {label}
            description={component.description}
            requiredIndicator={component.required}
            required={component.required}
          >
            <Switch bind:checked={switchValue} onCheckedChange={(check) => updateConfig(key, check)} />
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
