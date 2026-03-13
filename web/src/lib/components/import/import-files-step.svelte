<script lang="ts">
  import { Button, Icon } from '@immich/ui';
  import { mdiArrowLeft, mdiArrowRight, mdiClose, mdiFolderOpen, mdiTrayArrowDown, mdiZipBox } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    files: File[];
    totalSize: number;
    onAddFiles: (files: File[]) => void;
    onClearFiles: () => void;
    onNext: () => void;
    onBack: () => void;
  }

  let { files, totalSize, onAddFiles, onClearFiles, onNext, onBack }: Props = $props();

  let zipInput: HTMLInputElement | undefined = $state();
  let folderInput: HTMLInputElement | undefined = $state();
  let isDragging = $state(false);

  function formatSize(bytes: number): string {
    if (bytes === 0) {
      return '0 B';
    }
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false;
    const droppedFiles = event.dataTransfer?.files;
    if (droppedFiles) {
      onAddFiles([...droppedFiles]);
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragLeave() {
    isDragging = false;
  }

  function handleZipSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      onAddFiles([...input.files]);
      input.value = '';
    }
  }

  function handleFolderSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      onAddFiles([...input.files]);
      input.value = '';
    }
  }
</script>

<div class="flex flex-col gap-6">
  <h2 class="text-lg font-medium">{$t('import_select_files')}</h2>

  <!-- Drop zone -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    data-testid="drop-zone"
    class="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 transition-colors
      {isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-600'}"
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
  >
    <Icon icon={mdiTrayArrowDown} size="48" class="text-gray-400" />
    <p class="text-center text-gray-500">{$t('import_drop_files')}</p>
    <div class="flex gap-3">
      <Button variant="outline" leadingIcon={mdiZipBox} onclick={() => zipInput?.click()}>
        {$t('import_select_zips')}
      </Button>
      <Button variant="outline" leadingIcon={mdiFolderOpen} onclick={() => folderInput?.click()}>
        {$t('import_select_folder')}
      </Button>
    </div>
  </div>

  <!-- Hidden file inputs -->
  <input bind:this={zipInput} type="file" accept=".zip" multiple class="hidden" onchange={handleZipSelect} />
  <input bind:this={folderInput} type="file" webkitdirectory class="hidden" onchange={handleFolderSelect} />

  <!-- File list -->
  {#if files.length > 0}
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium">
          {$t('import_selected_files')} ({files.length})
        </h3>
        <Button variant="ghost" size="small" leadingIcon={mdiClose} onclick={onClearFiles}>
          {$t('import_clear')}
        </Button>
      </div>
      <div class="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
        {#each files as file (file.name)}
          <div
            class="flex items-center justify-between border-b border-gray-100 px-4 py-2 last:border-b-0 dark:border-gray-800"
          >
            <span class="truncate text-sm">{file.name}</span>
            <span class="ml-2 shrink-0 text-xs text-gray-400">{formatSize(file.size)}</span>
          </div>
        {/each}
      </div>
      <p class="text-sm text-gray-500">
        {$t('total')}: {formatSize(totalSize)}
      </p>
    </div>
  {/if}

  <!-- Navigation -->
  <div class="flex justify-between">
    <Button variant="outline" leadingIcon={mdiArrowLeft} onclick={onBack}>
      {$t('back')}
    </Button>
    <Button data-testid="next-button" disabled={files.length === 0} trailingIcon={mdiArrowRight} onclick={onNext}>
      {$t('next')}
    </Button>
  </div>
</div>
