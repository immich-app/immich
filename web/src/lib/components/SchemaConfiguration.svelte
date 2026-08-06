<script lang="ts">
  import SchemaAlbumPicker from '$lib/components/SchemaAlbumPicker.svelte';
  import Self from '$lib/components/SchemaConfiguration.svelte';
  import type { JSONSchemaProperty, SchemaConfig } from '$lib/types';
  import {
    CodeBlock,
    Field,
    HelperText,
    Input,
    Label,
    MultiSelect,
    NumberInput,
    Select,
    Switch,
    Text,
  } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    schema: JSONSchemaProperty;
    root?: boolean;
    key?: string;
    config: SchemaConfig;
  };

  let { schema, key = '', root = false, config = $bindable() }: Props = $props();

  const label = $derived(schema.title ?? key);
  const description = $derived(schema.description);

  const getValue = <T,>(defaultValue?: T) => (root ? config : (config?.[key] ?? defaultValue)) as T;
  const setValue = <T,>(value: T) => {
    if (root) {
      config = value;
    } else {
      if (config === undefined) {
        config = {};
      }

      config[key] = value;
    }
  };

  const getUiHintValue = () => {
    if (schema.array) {
      return getValue<string[]>([]);
    }

    const values = getValue<string>();
    return values ? [values] : [];
  };

  const setUiHintValue = (values: string[]) => setValue(schema.array ? values : values[0]);
  const getSchemaProperties = (schema: JSONSchemaProperty) =>
    Object.entries(schema.properties ?? {}).sort((a, b) => (a[1].uiHint?.order ?? 0) - (b[1].uiHint?.order ?? 0));

  const getBoolean = (defaultValue = false) => getValue<boolean>(defaultValue);
  const getString = () => getValue<string>();
  const getEnum = () => getValue<string[]>([]);
  const getNumber = () => getValue<number>();
</script>

<!-- Empty schema object -->
{#if Object.keys(schema).length === 0}
  <!-- noop -->
  <!-- nested configuration (also top level objects) -->
{:else if schema.type === 'object'}
  {#if !root}
    <div class="flex flex-col gap-2">
      <Label size="small" class="font-medium" {label}></Label>
      {#if description}
        <Text color="muted" size="small">{description}</Text>
      {/if}
    </div>
  {/if}
  <div class="flex flex-col gap-4 {root ? '' : 'border-l-4 border-gray-200 ps-2'}">
    {#each getSchemaProperties(schema) as [childKey, childSchema] (childKey)}
      <Self schema={childSchema} key={childKey} bind:config={getValue, setValue} />
    {/each}
  </div>
{:else if schema.uiHint?.type === 'AlbumId'}
  <SchemaAlbumPicker {label} {description} array={schema.array} bind:albumIds={getUiHintValue, setUiHintValue} />
{:else if schema.enum && schema.array}
  <Field {label} {description}>
    <MultiSelect options={schema.enum} bind:values={getEnum, setValue} />
  </Field>
{:else if schema.enum}
  <Field {label} {description}>
    <Select options={schema.enum} bind:value={getString, setValue} />
  </Field>
{:else if schema.array}
  {@const values = getValue<string[]>([])}
  <Field {label} {description}>
    <Input value={values.join(',')} disabled />
    <HelperText>{$t('unsupported_field_type')}</HelperText>
  </Field>
{:else if schema.type === 'boolean'}
  <Field {label} {description}>
    <Switch bind:checked={() => getBoolean(schema.default ?? false), setValue} />
  </Field>
{:else if schema.type === 'number'}
  <Field {label} {description}>
    <NumberInput bind:value={getNumber, setValue} step={schema.precision} min={schema.minimum} max={schema.maximum} />
  </Field>
{:else if schema.type === 'string'}
  <Field {label} {description}>
    <Input bind:value={() => getValue<string>(), setValue} />
  </Field>
{:else}
  <Text>{$t('unknown_schema')}</Text>
  <CodeBlock code={JSON.stringify(schema, null, 2)} />
{/if}
