<script lang="ts">
  import { handleEditLibraryFolder } from '$lib/services/library.service';
  import type { LibraryResponseDto } from '@immich/sdk';
  import { Button, Field, HStack, Input, Modal, ModalBody, ModalFooter, Text } from '@immich/ui';
  import { mdiFolderSync } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    library: LibraryResponseDto;
    folder: string;
    onClose: () => void;
  };

  const { library, folder, onClose }: Props = $props();

  let newFolder = $state(folder);

  const onsubmit = async () => {
    const success = await handleEditLibraryFolder(library, folder, newFolder);
    if (success) {
      onClose();
    }
  };
</script>

<Modal title={$t('library_edit_folder')} icon={mdiFolderSync} {onClose} size="small">
  <ModalBody>
    <form {onsubmit} autocomplete="off" id="library-import-path-form">
      <Text size="small" class="mb-4">{$t('admin.library_folder_description')}</Text>

      <Field label={$t('path')}>
        <Input bind:value={newFolder} />
      </Field>
    </form>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button shape="round" color="secondary" fullWidth onclick={() => onClose()}>{$t('cancel')}</Button>
      <Button shape="round" type="submit" fullWidth form="library-import-path-form">
        {$t('save')}
      </Button>
    </HStack>
  </ModalFooter>
</Modal>
