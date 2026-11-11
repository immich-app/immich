<script lang="ts">
  import { executeMutation } from '#lib/queries/client.ts';
  import { updateLibraryMutation } from '#lib/queries/library.query.ts';
  import type { LibraryResponseDto } from '@immich/sdk';
  import { Field, FormModal, Input, Text } from '@immich/ui';
  import { mdiFolderSync } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    library: LibraryResponseDto;
    folder: string;
    onClose: () => void;
  };

  const { library, folder: oldValue, onClose }: Props = $props();

  let newValue = $state(oldValue);

  const onSubmit = async () => {
    const importPaths = library.importPaths.map((path) => (path === oldValue ? newValue : path));
    await executeMutation(updateLibraryMutation, [{ id: library.id, updateLibraryDto: { importPaths } }], {
      onSuccess: onClose,
    });
  };

  const disabled = $derived(!newValue || newValue === oldValue);
</script>

<FormModal title={$t('library_edit_folder')} icon={mdiFolderSync} {onClose} {onSubmit} size="small" {disabled}>
  <Text size="small" class="mb-4">{$t('admin.library_folder_description')}</Text>
  <Field label={$t('path')}>
    <Input bind:value={newValue} />
  </Field>
</FormModal>
