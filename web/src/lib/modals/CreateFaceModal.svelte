<script lang="ts">
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { delay } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { createFace, createPerson } from '@immich/sdk';
  import { Field, FormModal, Input, LoadingSpinner, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    assetId: string;
    imageWidth: number;
    imageHeight: number;
    x: number;
    y: number;
    width: number;
    height: number;
    onClose: (created?: boolean) => void;
    previewUrl?: string;
  };

  let { assetId, imageWidth, imageHeight, x, y, width, height, onClose, previewUrl }: Props = $props();
  let personName = $state('');
  let isSubmitting = $state(false);

  const getTrimmedName = () => personName.trim();

  const onSubmit = async () => {
    const name = getTrimmedName();
    if (!name) {
      return;
    }

    try {
      isSubmitting = true;

      const person = await createPerson({
        personCreateDto: {
          name,
        },
      });

      await createFace({
        assetFaceCreateDto: {
          assetId,
          imageHeight,
          imageWidth,
          personId: person.id,
          x,
          y,
          width,
          height,
        },
      });

      await delay(1500);
      await assetViewerManager.setAssetId(assetId);
      onClose(true);
    } catch (error) {
      handleError(error, 'Error creating and tagging face');
    } finally {
      isSubmitting = false;
    }
  };
</script>

<FormModal
  size="small"
  title={$t('create_person')}
  submitText={$t('tag_face')}
  disabled={!getTrimmedName() || isSubmitting}
  {onClose}
  {onSubmit}
>
  <Text size="tiny" class="mb-4" color="muted">{$t('create_person_subtitle')}</Text>
  {#if previewUrl}
    <Field label={$t('preview')}>
      <div class="flex justify-center rounded-xl bg-gray-50 p-3 dark:border-gray-700 dark:bg-black/20 relative">
        <img src={previewUrl} alt={$t('preview')} class="max-h-48 rounded-lg object-contain shadow-sm" />
        {#if isSubmitting}
          <div class="flex place-items-center place-content-center absolute inset-0 bg-black/20 rounded-lg">
            <LoadingSpinner />
          </div>
        {/if}
      </div>
    </Field>
  {/if}

  <Field label={$t('name')} required class="mt-3">
    <Input autofocus bind:value={personName} disabled={isSubmitting} />
  </Field>
</FormModal>
