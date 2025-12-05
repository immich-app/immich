<script lang="ts">
  import WorkflowPickerItemCard from '$lib/components/workflows/WorkflowPickerItemCard.svelte';
  import AlbumPickerModal from '$lib/modals/AlbumPickerModal.svelte';
  import PeoplePickerModal from '$lib/modals/PeoplePickerModal.svelte';
  import type { ComponentConfig } from '$lib/utils/workflow';
  import { getAlbumInfo, getPerson, type AlbumResponseDto, type PersonResponseDto } from '@immich/sdk';
  import { Button, Field, modalManager } from '@immich/ui';
  import { mdiPlus } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    component: ComponentConfig;
    configKey: string;
    value: string | string[] | undefined;
    onchange: (value: string | string[]) => void;
  };

  let { component, configKey, value = $bindable(), onchange }: Props = $props();

  const label = $derived(component.title || component.label || configKey);
  const subType = $derived(component.subType as 'album-picker' | 'people-picker');
  const isAlbum = $derived(subType === 'album-picker');
  const multiple = $derived(component.type === 'multiselect' || Array.isArray(value));

  let pickerMetadata = $state<AlbumResponseDto | PersonResponseDto | AlbumResponseDto[] | PersonResponseDto[]>();

  $effect(() => {
    if (!value) {
      pickerMetadata = undefined;
      return;
    }

    void fetchMetadata();
  });

  const fetchMetadata = async () => {
    if (!value || pickerMetadata) {
      return;
    }

    try {
      if (Array.isArray(value) && value.length > 0) {
        // Multiple selection
        pickerMetadata = await (isAlbum
          ? Promise.all(value.map((id) => getAlbumInfo({ id })))
          : Promise.all(value.map((id) => getPerson({ id }))));
      } else if (typeof value === 'string' && value) {
        // Single selection
        pickerMetadata = await (isAlbum ? getAlbumInfo({ id: value }) : getPerson({ id: value }));
      }
    } catch (error) {
      console.error(`Failed to fetch metadata for ${configKey}:`, error);
    }
  };

  const handlePicker = async () => {
    if (isAlbum) {
      const albums = await modalManager.show(AlbumPickerModal, { shared: false });
      if (albums && albums.length > 0) {
        const newValue = multiple ? albums.map((a) => a.id) : albums[0].id;
        onchange(newValue);
        pickerMetadata = multiple ? albums : albums[0];
      }
    } else {
      const currentIds = (Array.isArray(value) ? value : []) as string[];
      const excludedIds = multiple ? currentIds : [];
      const people = await modalManager.show(PeoplePickerModal, { multiple, excludedIds });
      if (people && people.length > 0) {
        const newValue = multiple ? people.map((p) => p.id) : people[0].id;
        onchange(newValue);
        pickerMetadata = multiple ? people : people[0];
      }
    }
  };

  const removeSelection = () => {
    onchange(multiple ? [] : '');
    pickerMetadata = undefined;
  };

  const removeItemFromSelection = (itemId: string) => {
    if (!Array.isArray(value)) {
      return;
    }

    const newValue = value.filter((id) => id !== itemId);
    onchange(newValue);

    if (Array.isArray(pickerMetadata)) {
      pickerMetadata = pickerMetadata.filter((item) => item.id !== itemId) as AlbumResponseDto[] | PersonResponseDto[];
    }
  };

  const getButtonText = () => {
    if (isAlbum) {
      return multiple ? $t('select_albums') : $t('select_album');
    }
    return multiple ? $t('select_people') : $t('select_person');
  };
</script>

<Field {label} required={component.required} description={component.description} requiredIndicator={component.required}>
  <div class="flex flex-col gap-3">
    {#if pickerMetadata && !Array.isArray(pickerMetadata)}
      <WorkflowPickerItemCard item={pickerMetadata} {isAlbum} onRemove={removeSelection} />
    {:else if pickerMetadata && Array.isArray(pickerMetadata) && pickerMetadata.length > 0}
      <div class="flex flex-col gap-2">
        {#each pickerMetadata as item (item.id)}
          <WorkflowPickerItemCard {item} {isAlbum} onRemove={() => removeItemFromSelection(item.id)} />
        {/each}
      </div>
    {/if}
    <Button size="small" variant="outline" leadingIcon={mdiPlus} onclick={handlePicker}>
      {getButtonText()}
    </Button>
  </div>
</Field>
