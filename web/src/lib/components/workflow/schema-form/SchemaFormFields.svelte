<script lang="ts">
  import { Field, Input, Switch } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    schema: Record<string, unknown> | undefined;
    config: Record<string, unknown> | undefined;
  }

  let { schema, config = $bindable({}) }: Props = $props();

  // Ensure config is always an object
  $effect(() => {
    if (!config || typeof config !== 'object') {
      config = {};
    }
  });

  // Type helper for safely accessing config values
  const getConfigValue = (key: string): unknown => config[key];
  const setConfigValue = (key: string, value: unknown) => {
    config[key] = value;
  };
</script>

{#if schema && schema.properties}
  <div class="flex flex-col gap-3">
    {#each Object.entries(schema.properties) as [key, prop] (key)}
      {@const property = prop as Record<string, unknown>}
      {@const required = (schema.required as string[] | undefined)?.includes(key)}
      {@const description = (property.description as string) || ''}
      {@const enumValues = Array.isArray(property.enum) ? property.enum : []}

      {#if property.type === 'string'}
        {#if enumValues.length > 0}
          <Field label={key} {required}>
            <select
              value={getConfigValue(key) as string}
              onchange={(e) => setConfigValue(key, e.currentTarget.value)}
              class="immich-form-input w-full"
              {required}
            >
              {#each enumValues as option (option)}
                <option value={option}>{option}</option>
              {/each}
            </select>
            {#if description}
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">{description}</p>
            {/if}
          </Field>
        {:else}
          <Field label={key} {required}>
            <Input
              value={getConfigValue(key) as string}
              oninput={(e) => setConfigValue(key, e.currentTarget.value)}
              placeholder={property.default as string}
              {required}
            />
            {#if description}
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">{description}</p>
            {/if}
          </Field>
        {/if}
      {:else if property.type === 'boolean'}
        <Field label={key}>
          <Switch checked={getConfigValue(key) as boolean} onchange={(checked) => setConfigValue(key, checked)} />
          {#if description}
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">{description}</p>
          {/if}
        </Field>
      {:else if property.type === 'number' || property.type === 'integer'}
        <Field label={key} {required}>
          <Input
            type="number"
            value={getConfigValue(key) as string}
            oninput={(e) => setConfigValue(key, e.currentTarget.value)}
            placeholder={(property.default as number | undefined)?.toString()}
            {required}
          />
          {#if description}
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">{description}</p>
          {/if}
        </Field>
      {:else if property.type === 'array'}
        <Field label={key} {required}>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            {$t('array_field_not_fully_supported')}
          </div>
          {#if description}
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">{description}</p>
          {/if}
        </Field>
      {:else}
        <Field label={key}>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            {$t('unsupported_field_type')}: {property.type}
          </div>
        </Field>
      {/if}
    {/each}
  </div>
{:else}
  <div class="text-sm text-gray-600 dark:text-gray-400">
    {$t('no_configuration_needed')}
  </div>
{/if}
