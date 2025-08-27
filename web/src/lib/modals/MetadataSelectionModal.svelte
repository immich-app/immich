<script lang="ts">
  import {
    metadataPreferenceStore,
    showAllMetadataStore,
    type MetadataPreference,
  } from '$lib/stores/duplicates-metadata.store';
  import { Button, Checkbox, ConfirmModal, Label, Text, VStack } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: (saved?: MetadataPreference) => void;
  }

  let { onClose }: Props = $props();

  // Snapshot of the current preferences to edit locally
  let currentSelection: MetadataPreference = $state({ ...$metadataPreferenceStore });
  let showAll: boolean = $state($showAllMetadataStore);

  const handleToggleAll = (value: boolean) => {
    // Reassign a new object to ensure reactivity and avoid inplace mutations
    const next: MetadataPreference = {
      fileCreatedAt: value,
      fileModifiedAt: value,
      originalFileName: value,
      originalPath: value,
      dateTimeOriginal: value,
      description: value,
      exposureTime: value,
      fNumber: value,
      focalLength: value,
      iso: value,
      lensModel: value,
      make: value,
      model: value,
      modifyDate: value,
      orientation: value,
      projectionType: value,
      rating: value,
      city: value,
      country: value,
      state: value,
      timeZone: value,
      latitude: value,
      longitude: value,
    };
    currentSelection = next;
  };

  const handleConfirmModalClose = (confirmed: boolean) => {
    if (confirmed) {
      const snapshot: MetadataPreference = { ...currentSelection };
      onClose(snapshot);
      queueMicrotask(() => {
        metadataPreferenceStore.set(snapshot);
        showAllMetadataStore.set(showAll);
      });
      return;
    }
    onClose();
  };
</script>

<ConfirmModal
  confirmColor="primary"
  title={$t('metadata_selection_modal.title')}
  prompt=""
  confirmText={$t('save')}
  onClose={handleConfirmModalClose}
>
  {#snippet promptSnippet()}
    <VStack gap={4} class="w-full text-start">
      <div class="flex justify-between w-full">
        <Button size="small" shape="round" onclick={() => handleToggleAll(true)}
          >{$t('metadata_selection_modal.select_all')}</Button
        >
        <Button size="small" shape="round" onclick={() => handleToggleAll(false)}
          >{$t('metadata_selection_modal.unselect_all')}</Button
        >
      </div>

      <div class="flex items-center justify-between w-full">
        <div class="flex gap-2 items-center">
          <Checkbox id="showAllMetadata-checkbox" bind:checked={showAll} />
          <Label label={$t('metadata_selection_modal.show_all_metadata')} for="showAllMetadata-checkbox" />
        </div>
        <Text class="text-sm text-gray-600 dark:text-gray-300"
          >{showAll
            ? $t('metadata_selection_modal.show_all_metadata_hint_on')
            : $t('metadata_selection_modal.show_all_metadata_hint_off')}</Text
        >
      </div>

      <Text class="font-semibold text-lg">{$t('metadata_selection_modal.asset_properties_label')}</Text>
      <VStack gap={2} class="items-start w-full">
        <div class="flex gap-2 items-center">
          <Checkbox id="fileCreatedAt-checkbox" bind:checked={currentSelection.fileCreatedAt} />
          <Label label={$t('created_at')} for="fileCreatedAt-checkbox" />
        </div>
        <div class="flex gap-2 items-center">
          <Checkbox id="fileModifiedAt-checkbox" bind:checked={currentSelection.fileModifiedAt} />
          <Label label={$t('updated_at')} for="fileModifiedAt-checkbox" />
        </div>
        <div class="flex gap-2 items-center">
          <Checkbox id="originalFileName-checkbox" bind:checked={currentSelection.originalFileName} />
          <Label label={$t('filename')} for="originalFileName-checkbox" />
        </div>
        <div class="flex gap-2 items-center">
          <Checkbox id="originalPath-checkbox" bind:checked={currentSelection.originalPath} />
          <Label label={$t('path')} for="originalPath-checkbox" />
        </div>
      </VStack>

      <Text class="font-semibold text-lg">{$t('metadata_selection_modal.exif_properties_label')}</Text>
      <VStack gap={2} class="items-start w-full">
        <div class="flex gap-2 items-center">
          <Checkbox id="dateTimeOriginal-checkbox" bind:checked={currentSelection.dateTimeOriginal} />
          <Label label={$t('metadata_selection_modal.date_time_original')} for="dateTimeOriginal-checkbox" />
        </div>
        <div class="flex gap-2 items-center">
          <Checkbox id="description-checkbox" bind:checked={currentSelection.description} />
          <Label label={$t('description')} for="description-checkbox" />
        </div>
        <div class="flex gap-2 items-center">
          <Checkbox id="exposureTime-checkbox" bind:checked={currentSelection.exposureTime} />
          <Label label={$t('metadata_selection_modal.exposure_time')} for="exposureTime-checkbox" />
        </div>
        <div class="flex gap-2 items-center">
          <Checkbox id="fNumber-checkbox" bind:checked={currentSelection.fNumber} />
          <Label label={$t('metadata_selection_modal.f_number')} for="fNumber-checkbox" />
        </div>
        <div class="flex gap-2 items-center">
          <Checkbox id="focalLength-checkbox" bind:checked={currentSelection.focalLength} />
          <Label label={$t('metadata_selection_modal.focal_length')} for="focalLength-checkbox" />
        </div>
        <div class="flex gap-2 items-center">
          <Checkbox id="iso-checkbox" bind:checked={currentSelection.iso} />
          <Label label={$t('metadata_selection_modal.iso')} for="iso-checkbox" />
        </div>
        <div class="flex gap-2 items-center">
          <Checkbox id="lensModel-checkbox" bind:checked={currentSelection.lensModel} />
          <Label label={$t('lens_model')} for="lensModel-checkbox" />
        </div>
        <div class="flex gap-2 items-center">
          <Checkbox id="make-checkbox" bind:checked={currentSelection.make} />
          <Label label={$t('make')} for="make-checkbox" />
        </div>
        <div class="flex gap-2 items-center">
          <Checkbox id="model-checkbox" bind:checked={currentSelection.model} />
          <Label label={$t('model')} for="model-checkbox" />
        </div>
        <div class="flex gap-2 items-center">
          <Checkbox id="modifyDate-checkbox" bind:checked={currentSelection.modifyDate} />
          <Label label={$t('metadata_selection_modal.modify_date')} for="modifyDate-checkbox" />
        </div>
        <div class="flex gap-2 items-center">
          <Checkbox id="orientation-checkbox" bind:checked={currentSelection.orientation} />
          <Label label={$t('metadata_selection_modal.orientation')} for="orientation-checkbox" />
        </div>
        <div class="flex gap-2 items-center">
          <Checkbox id="projectionType-checkbox" bind:checked={currentSelection.projectionType} />
          <Label label={$t('metadata_selection_modal.projection_type')} for="projectionType-checkbox" />
        </div>
        <div class="flex gap-2 items-center">
          <Checkbox id="rating-checkbox" bind:checked={currentSelection.rating} />
          <Label label={$t('rating')} for="rating-checkbox" />
        </div>
      </VStack>

      <Text class="font-semibold text-lg">{$t('metadata_selection_modal.location_properties_label')}</Text>
      <VStack gap={2} class="items-start w-full">
        <div class="flex gap-2 items-center">
          <Checkbox id="city-checkbox" bind:checked={currentSelection.city} />
          <Label label={$t('city')} for="city-checkbox" />
        </div>
        <div class="flex gap-2 items-center">
          <Checkbox id="country-checkbox" bind:checked={currentSelection.country} />
          <Label label={$t('country')} for="country-checkbox" />
        </div>
        <div class="flex gap-2 items-center">
          <Checkbox id="state-checkbox" bind:checked={currentSelection.state} />
          <Label label={$t('state')} for="state-checkbox" />
        </div>
        <div class="flex gap-2 items-center">
          <Checkbox id="timeZone-checkbox" bind:checked={currentSelection.timeZone} />
          <Label label={$t('timezone')} for="timeZone-checkbox" />
        </div>
        <div class="flex gap-2 items-center">
          <Checkbox id="latitude-checkbox" bind:checked={currentSelection.latitude} />
          <Label label={$t('latitude')} for="latitude-checkbox" />
        </div>
        <div class="flex gap-2 items-center">
          <Checkbox id="longitude-checkbox" bind:checked={currentSelection.longitude} />
          <Label label={$t('longitude')} for="longitude-checkbox" />
        </div>
      </VStack>
    </VStack>
  {/snippet}
</ConfirmModal>
