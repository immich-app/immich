<script lang="ts">
  import { handleAddLibraryFolder } from '$lib/services/library.service';
  import type { LibraryResponseDto } from '@immich/sdk';
  import { Field, FormModal, Input, Text } from '@immich/ui';
  import { mdiFolderSync } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    library: LibraryResponseDto;
    onClose: () => void;
  };

  const { library, onClose }: Props = $props();
  let value = $state('');

  const onSubmit = async () => {
    const success = await handleAddLibraryFolder(library, value);
    if (success) {
      onClose();
    }
  };
</script>

<FormModal
  title={$t('library_add_folder')}
  icon={mdiFolderSync}
  {onClose}
  {onSubmit}
  size="small"
  submitText={$t('add')}
>
  <Text size="small" class="mb-4">{$t('admin.library_folder_description')}</Text>
  <Field label={$t('path')}>
    <Input bind:value />
  </Field>
</FormModal>
