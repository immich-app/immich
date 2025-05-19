<script lang="ts">
  import { Button, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiFolderSync } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    importPath: string | null;
    importPaths?: string[];
    title?: string;
    cancelText?: string;
    submitText?: string;
    isEditing?: boolean;
    onCancel: () => void;
    onSubmit: (importPath: string | null) => void;
    onDelete?: () => void;
  }

  let {
    importPath = $bindable(),
    importPaths = $bindable([]),
    title = $t('import_path'),
    cancelText = $t('cancel'),
    submitText = $t('save'),
    isEditing = false,
    onCancel,
    onSubmit,
    onDelete,
  }: Props = $props();

  onMount(() => {
    if (isEditing) {
      importPaths = importPaths.filter((path) => path !== importPath);
    }
  });

  let isDuplicate = $derived(importPath !== null && importPaths.includes(importPath));
  let canSubmit = $derived(importPath !== '' && importPath !== null && !importPaths.includes(importPath));

  const onsubmit = (event: Event) => {
    event.preventDefault();
    if (canSubmit) {
      onSubmit(importPath);
    }
  };
</script>

<Modal {title} icon={mdiFolderSync} onClose={onCancel} size="small">
  <ModalBody>
    <form {onsubmit} autocomplete="off" id="library-import-path-form">
      <p class="py-5 text-sm">{$t('admin.library_import_path_description')}</p>

      <div class="my-4 flex flex-col gap-2">
        <label class="immich-form-label" for="path">{$t('path')}</label>
        <input class="immich-form-input" id="path" name="path" type="text" bind:value={importPath} />
      </div>

      <div class="mt-8 flex w-full gap-4">
        {#if isDuplicate}
          <p class="text-red-500 text-sm">{$t('errors.import_path_already_exists')}</p>
        {/if}
      </div>
    </form>
  </ModalBody>

  <ModalFooter>
    <div class="flex gap-2 w-full">
      <Button shape="round" color="secondary" fullWidth onclick={onCancel}>{cancelText}</Button>
      {#if isEditing}
        <Button shape="round" color="danger" fullWidth onclick={onDelete}>{$t('delete')}</Button>
      {/if}
      <Button shape="round" type="submit" disabled={!canSubmit} fullWidth form="library-import-path-form"
        >{submitText}</Button
      >
    </div>
  </ModalFooter>
</Modal>
