<script lang="ts">
  import { assetViewerManager } from '#lib/managers/asset-viewer-manager.svelte.ts';
  import { executeMutation } from '#lib/queries/client.ts';
  import { createFaceMutation } from '#lib/queries/face.query.ts';
  import { createPersonMutation } from '#lib/queries/person.query.ts';
  import { delay } from '#lib/utils/asset-utils.ts';
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

    isSubmitting = true;

    const onSuccess = async () => {
      await delay(1500);
      await assetViewerManager.setAssetId(assetId);
      onClose(true);
      isSubmitting = false;
    };

    const createFace = (personId: string) =>
      executeMutation(
        createFaceMutation,
        [{ assetFaceCreateDto: { assetId, imageHeight, imageWidth, personId, x, y, width, height } }],
        { onSuccess: () => void onSuccess(), onError: () => (isSubmitting = false) },
      );

    await executeMutation(createPersonMutation, [{ personCreateDto: { name } }], {
      onSuccess: ({ id }) => void createFace(id),
      onError: () => (isSubmitting = false),
    });
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
      <div class="relative flex justify-center rounded-xl bg-gray-50 p-3 dark:border-gray-700 dark:bg-black/20">
        <img src={previewUrl} alt={$t('preview')} class="max-h-48 rounded-lg object-contain shadow-sm" />
        {#if isSubmitting}
          <div class="absolute inset-0 flex place-content-center place-items-center rounded-lg bg-black/20">
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
