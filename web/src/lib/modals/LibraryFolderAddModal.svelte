<script lang="ts">
  import { handleAddLibraryFolder } from '$lib/services/library.service';
  import type { LibraryResponseDto } from '@immich/sdk';
  import { Button, Field, HStack, Input, Modal, ModalBody, ModalFooter, Text } from '@immich/ui';
  import { mdiFolderSync } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    library: LibraryResponseDto;
    onClose: () => void;
  };

  const { library, onClose }: Props = $props();
  let folder = $state('');

  const onsubmit = async () => {
    const success = await handleAddLibraryFolder(library, folder);

    if (success) {
      onClose();
    }
  };
</script>

<Modal title={$t('library_add_folder')} icon={mdiFolderSync} {onClose} size="small">
  <ModalBody>
    <form {onsubmit} autocomplete="off" id="library-import-path-form">
      <Text size="small" class="mb-4">{$t('admin.library_folder_description')}</Text>

      <Field label={$t('path')}>
        <Input bind:value={folder} />
      </Field>
    </form>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button shape="round" color="secondary" fullWidth onclick={() => onClose()}>{$t('cancel')}</Button>
      <Button shape="round" type="submit" fullWidth form="library-import-path-form">
        {$t('add')}
      </Button>
    </HStack>
  </ModalFooter>
</Modal>
