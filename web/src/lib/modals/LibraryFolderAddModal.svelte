<script lang="ts">
  import { executeMutation } from '$lib/queries/client';
  import { updateLibraryMutation } from '$lib/queries/library.query';
  import type { LibraryResponseDto } from '@immich/sdk';
  import { Field, FormModal, HelperText, Input, Text } from '@immich/ui';
  import { mdiFolderSync } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    library: LibraryResponseDto;
    onClose: () => void;
  };

  const { library, onClose }: Props = $props();
  let value = $state('');
  const exists = $derived(library.importPaths.includes(value));

  const onSubmit = async () => {
    const importPaths = [...library.importPaths, value];
    await executeMutation(updateLibraryMutation(), [{ id: library.id, updateLibraryDto: { importPaths } }], {
      onSuccess: onClose,
    });
  };
</script>

<FormModal
  title={$t('library_add_folder')}
  icon={mdiFolderSync}
  {onClose}
  {onSubmit}
  size="small"
  submitText={$t('add')}
  disabled={!value || exists}
>
  <Text size="small" class="mb-4">{$t('admin.library_folder_description')}</Text>
  <Field label={$t('path')}>
    <Input bind:value />
    {#if exists}
      <HelperText color="danger">{$t('errors.library_folder_already_exists')}</HelperText>
    {/if}
  </Field>
</FormModal>
