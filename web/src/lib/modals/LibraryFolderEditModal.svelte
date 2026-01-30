<script lang="ts">
  import { handleEditLibraryFolder } from '$lib/services/library.service';
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
    const success = await handleEditLibraryFolder(library, oldValue, newValue);
    if (success) {
      onClose();
    }
  };
</script>

<FormModal title={$t('library_edit_folder')} icon={mdiFolderSync} {onClose} {onSubmit} size="small">
  <Text size="small" class="mb-4">{$t('admin.library_folder_description')}</Text>
  <Field label={$t('path')}>
    <Input bind:value={newValue} />
  </Field>
</FormModal>
