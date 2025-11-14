<script lang="ts">
  import { handleEditImportPath } from '$lib/services/library.service';
  import type { LibraryResponseDto } from '@immich/sdk';
  import { Button, HStack, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiFolderSync } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    library: LibraryResponseDto;
    importPath: string;
    onClose: () => void;
  };

  const { library, importPath, onClose }: Props = $props();

  let newImportPath = $state(importPath);

  const onsubmit = async () => {
    const success = await handleEditImportPath(library, importPath, newImportPath);
    if (success) {
      onClose();
    }
  };
</script>

<Modal title={$t('edit_import_path')} icon={mdiFolderSync} {onClose} size="small">
  <ModalBody>
    <form {onsubmit} autocomplete="off" id="library-import-path-form">
      <p class="py-5 text-sm">{$t('admin.library_import_path_description')}</p>

      <div class="my-4 flex flex-col gap-2">
        <label class="immich-form-label" for="path">{$t('path')}</label>
        <input class="immich-form-input" id="path" name="path" type="text" bind:value={newImportPath} />
      </div>
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
