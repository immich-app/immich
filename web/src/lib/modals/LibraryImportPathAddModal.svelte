<script lang="ts">
  import { handleAddImportPath } from '$lib/services/library.service';
  import type { LibraryResponseDto } from '@immich/sdk';
  import { Button, HStack, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiFolderSync } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    library: LibraryResponseDto;
    onClose: () => void;
  };

  const { library, onClose }: Props = $props();
  let importPath = $state('');

  const onsubmit = async () => {
    const success = await handleAddImportPath(library, importPath);

    if (success) {
      onClose();
    }
  };
</script>

<Modal title={$t('add_import_path')} icon={mdiFolderSync} {onClose} size="small">
  <ModalBody>
    <form {onsubmit} autocomplete="off" id="library-import-path-form">
      <p class="py-5 text-sm">{$t('admin.library_import_path_description')}</p>

      <div class="my-4 flex flex-col gap-2">
        <label class="immich-form-label" for="path">{$t('path')}</label>
        <input class="immich-form-input" id="path" name="path" type="text" bind:value={importPath} />
      </div>
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
