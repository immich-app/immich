<script lang="ts">
  import AlbumPickerModal from '$lib/modals/AlbumPickerModal.svelte';
  import PeoplePickerModal from '$lib/modals/PeoplePickerModal.svelte';
  import { getAssetThumbnailUrl, getPeopleThumbnailUrl } from '$lib/utils';
  import { formatLabel, getComponentFromSchema } from '$lib/utils/workflow';
  import { getAlbumInfo, getPerson, type AlbumResponseDto, type PersonResponseDto } from '@immich/sdk';
  import { Button, Field, Input, MultiSelect, Select, Switch, Text, modalManager, type SelectItem } from '@immich/ui';
  import { mdiPlus } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    schema: object | null;
    config: Record<string, unknown>;
    configKey?: string;
  }

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
  let pickerMetadata = $state<
    Record<string, AlbumResponseDto | PersonResponseDto | AlbumResponseDto[] | PersonResponseDto[]>
  >({});

  // Fetch metadata for existing picker values (albums/people)
  $effect(() => {
    if (!components) {
      return;
    }

    const fetchMetadata = async () => {
      const metadataUpdates: Record<
        string,
        AlbumResponseDto | PersonResponseDto | AlbumResponseDto[] | PersonResponseDto[]
      > = {};

      for (const [key, component] of Object.entries(components)) {
        const value = actualConfig[key];
        if (!value || pickerMetadata[key]) {
          continue; // Skip if no value or already loaded
        }

        const isAlbumPicker = component.subType === 'album-picker';
        const isPeoplePicker = component.subType === 'people-picker';

        if (!isAlbumPicker && !isPeoplePicker) {
          continue;
        }

        try {
          if (Array.isArray(value) && value.length > 0) {
            // Multiple selection
            if (isAlbumPicker) {
              const albums = await Promise.all(value.map((id) => getAlbumInfo({ id })));
              metadataUpdates[key] = albums;
            } else if (isPeoplePicker) {
              const people = await Promise.all(value.map((id) => getPerson({ id })));
              metadataUpdates[key] = people;
            }
          } else if (typeof value === 'string' && value) {
            // Single selection
            if (isAlbumPicker) {
              const album = await getAlbumInfo({ id: value });
              metadataUpdates[key] = album;
            } else if (isPeoplePicker) {
              const person = await getPerson({ id: value });
              metadataUpdates[key] = person;
            }
          }
        } catch (error) {
          console.error(`Failed to fetch metadata for ${key}:`, error);
        }
      }

      if (Object.keys(metadataUpdates).length > 0) {
        pickerMetadata = { ...pickerMetadata, ...metadataUpdates };
      }
    };

    void fetchMetadata();
  });

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

  const handleAlbumPicker = async (key: string, multiple: boolean) => {
    const albums = await modalManager.show(AlbumPickerModal, { shared: false });
    if (albums && albums.length > 0) {
      const value = multiple ? albums.map((a) => a.id) : albums[0].id;
      updateConfig(key, value);
      pickerMetadata = {
        ...pickerMetadata,
        [key]: multiple ? albums : albums[0],
      };
    }
  };

  const handlePeoplePicker = async (key: string, multiple: boolean) => {
    const people = await modalManager.show(PeoplePickerModal, { multiple });
    if (people && people.length > 0) {
      const value = multiple ? people.map((p) => p.id) : people[0].id;
      updateConfig(key, value);
      pickerMetadata = {
        ...pickerMetadata,
        [key]: multiple ? people : people[0],
      };
    }
  };

  const removeSelection = (key: string) => {
    const { [key]: _, ...rest } = actualConfig;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [key]: _removed, ...restMetadata } = pickerMetadata;

    config = configKey ? { ...config, [configKey]: rest } : rest;
    pickerMetadata = restMetadata;
  };

  const removeItemFromSelection = (key: string, itemId: string) => {
    const currentIds = actualConfig[key] as string[];
    const currentMetadata = pickerMetadata[key] as (AlbumResponseDto | PersonResponseDto)[];

    updateConfig(
      key,
      currentIds.filter((id) => id !== itemId),
    );
    pickerMetadata = {
      ...pickerMetadata,
      [key]: currentMetadata.filter((item) => item.id !== itemId) as AlbumResponseDto[] | PersonResponseDto[],
    };
  };

  const renderPicker = (subType: 'album-picker' | 'people-picker', multiple: boolean) => {
    const isAlbum = subType === 'album-picker';
    const handler = isAlbum ? handleAlbumPicker : handlePeoplePicker;
    const selectSingleLabel = isAlbum ? 'select_album' : 'select_person';
    const selectMultiLabel = isAlbum ? 'select_albums' : 'select_people';

    const buttonText = multiple ? $t(selectMultiLabel) : $t(selectSingleLabel);

    return { handler, buttonText };
  };
</script>

{#snippet pickerItemCard(
  item: AlbumResponseDto | PersonResponseDto,
  isAlbum: boolean,
  size: 'large' | 'small',
  onRemove: () => void,
)}
  {@const sizeClass = size === 'large' ? 'h-16 w-16' : 'h-12 w-12'}
  {@const textSizeClass = size === 'large' ? 'font-medium' : 'font-medium text-sm'}
  {@const iconSizeClass = size === 'large' ? 'h-5 w-5' : 'h-4 w-4'}
  {@const countSizeClass = size === 'large' ? 'text-sm' : 'text-xs'}

  <div
    class="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 shadow-sm"
  >
    <div class="shrink-0">
      {#if isAlbum && 'albumThumbnailAssetId' in item}
        {#if item.albumThumbnailAssetId}
          <img
            src={getAssetThumbnailUrl(item.albumThumbnailAssetId)}
            alt={item.albumName}
            class="{sizeClass} rounded-lg object-cover"
          />
        {:else}
          <div class="{sizeClass} rounded-lg bg-gray-200 dark:bg-gray-700"></div>
        {/if}
      {:else if !isAlbum && 'name' in item}
        <img src={getPeopleThumbnailUrl(item)} alt={item.name} class="{sizeClass} rounded-full object-cover" />
      {/if}
    </div>
    <div class="flex-1 min-w-0">
      <p class="{textSizeClass} text-gray-900 dark:text-gray-100 truncate">
        {isAlbum && 'albumName' in item ? item.albumName : 'name' in item ? item.name : ''}
      </p>
      {#if isAlbum && 'assetCount' in item}
        <p class="{countSizeClass} text-gray-500 dark:text-gray-400">
          {$t('items_count', { values: { count: item.assetCount } })}
        </p>
      {/if}
    </div>
    <button
      type="button"
      onclick={onRemove}
      class="shrink-0 rounded-full p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={$t('remove')}
    >
      <svg class={iconSizeClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
{/snippet}

{#snippet pickerField(
  subType: string,
  key: string,
  label: string,
  component: { required?: boolean; description?: string },
  multiple: boolean,
)}
  {@const picker = renderPicker(subType as 'album-picker' | 'people-picker', multiple)}
  {@const metadata = pickerMetadata[key]}
  {@const isAlbum = subType === 'album-picker'}

  <Field
    {label}
    required={component.required}
    description={component.description}
    requiredIndicator={component.required}
  >
    <div class="flex flex-col gap-3">
      {#if metadata && !Array.isArray(metadata)}
        {@render pickerItemCard(metadata, isAlbum, 'large', () => removeSelection(key))}
      {:else if metadata && Array.isArray(metadata) && metadata.length > 0}
        <div class="flex flex-col gap-2">
          {#each metadata as item (item.id)}
            {@render pickerItemCard(item, isAlbum, 'small', () => removeItemFromSelection(key, item.id))}
          {/each}
        </div>
      {/if}
      <Button size="small" variant="outline" leadingIcon={mdiPlus} onclick={() => picker.handler(key, multiple)}>
        {picker.buttonText}
      </Button>
    </div>
  </Field>
{/snippet}

{#if components}
  <div class="flex flex-col gap-2">
    {#each Object.entries(components) as [key, component] (key)}
      {@const label = component.title || component.label || key}

      <div class="flex flex-col gap-1 bg-light-50 border p-4 rounded-xl">
        <!-- Select component -->
        {#if component.type === 'select'}
          {#if component.subType === 'album-picker' || component.subType === 'people-picker'}
            {@render pickerField(component.subType, key, label, component, false)}
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
          {#if component.subType === 'album-picker' || component.subType === 'people-picker'}
            {@render pickerField(component.subType, key, label, component, true)}
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
        {:else if component.subType === 'album-picker' || component.subType === 'people-picker'}
          {@render pickerField(component.subType, key, label, component, false)}
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
