<script lang="ts">
  import { googlePhotosImportStore } from '$lib/stores/google-photos-import.store';
  import byteSize from 'byte-size';

  let isDragging = $state(false);
  let fileInput: HTMLInputElement;

  const store = $derived.by(() => {
    let value: typeof $googlePhotosImportStore;
    googlePhotosImportStore.subscribe((v) => (value = v))();
    return value!;
  });

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragLeave() {
    isDragging = false;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false;

    const files = event.dataTransfer?.files;
    if (files) {
      processFiles(Array.from(files));
    }
  }

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      processFiles(Array.from(input.files));
    }
    input.value = '';
  }

  function processFiles(files: File[]) {
    const zipFiles = files.filter(
      (file) => file.name.toLowerCase().endsWith('.zip') || file.type === 'application/zip'
    );

    if (zipFiles.length === 0) {
      // Could show a toast here
      console.warn('No ZIP files found');
      return;
    }

    googlePhotosImportStore.addUploadedFiles(zipFiles);
  }

  function removeFile(index: number) {
    googlePhotosImportStore.removeUploadedFile(index);
  }

  function openFilePicker() {
    fileInput?.click();
  }
</script>

<div class="drop-zone-container">
  <div class="header">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path fill-rule="evenodd" d="M11.47 2.47a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06l-3.22-3.22V16.5a.75.75 0 01-1.5 0V4.81L8.03 8.03a.75.75 0 01-1.06-1.06l4.5-4.5zM3 15.75a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clip-rule="evenodd" />
      </svg>
    </div>
    <div class="text">
      <h3>Step 2: Upload Takeout Files</h3>
      <p>Drag and drop your Google Takeout ZIP files here</p>
    </div>
  </div>

  <div
    class="drop-zone"
    class:dragging={isDragging}
    role="button"
    tabindex="0"
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    onclick={openFilePicker}
    onkeydown={(e) => e.key === 'Enter' && openFilePicker()}
  >
    <input
      bind:this={fileInput}
      type="file"
      accept=".zip,application/zip"
      multiple
      onchange={handleFileSelect}
      class="hidden-input"
    />

    <div class="drop-zone-content">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="drop-icon">
        <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
      </svg>
      <p class="drop-text">
        {#if isDragging}
          Drop files here...
        {:else}
          Drag & drop <strong>takeout-*.zip</strong> files here
        {/if}
      </p>
      <p class="drop-subtext">or click to browse</p>
    </div>
  </div>

  {#if store.uploadedFiles.length > 0}
    <div class="file-list">
      <h4>Selected files ({store.uploadedFiles.length})</h4>
      <ul>
        {#each store.uploadedFiles as file, index (index)}
          <li>
            <div class="file-info">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="file-icon">
                <path fill-rule="evenodd" d="M15.988 3.012A2.25 2.25 0 0118 5.25v6.5A2.25 2.25 0 0115.75 14H13.5V7A2.5 2.5 0 0011 4.5H8.128a2.252 2.252 0 011.884-1.488A2.25 2.25 0 0112.25 1h1.5a2.25 2.25 0 012.238 2.012zM11.5 3.25a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v.25h-3v-.25z" clip-rule="evenodd" />
                <path fill-rule="evenodd" d="M2 7a1 1 0 011-1h8a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V7zm2 3.25a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75zm0 3.5a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75z" clip-rule="evenodd" />
              </svg>
              <span class="file-name">{file.name}</span>
              <span class="file-size">{byteSize(file.size).toString()}</span>
            </div>
            <button type="button" class="remove-btn" onclick={() => removeFile(index)} aria-label="Remove file">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </li>
        {/each}
      </ul>
      <div class="total-size">
        Total: {byteSize(store.uploadedFiles.reduce((sum, f) => sum + f.size, 0)).toString()}
      </div>
    </div>
  {/if}
</div>

<style>
  .drop-zone-container {
    background: var(--immich-bg);
    border: 1px solid var(--immich-border);
    border-radius: 0.75rem;
    padding: 1.5rem;
  }

  .header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .icon {
    flex-shrink: 0;
    width: 3rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--immich-primary);
    color: white;
    border-radius: 0.5rem;
  }

  .icon svg {
    width: 1.75rem;
    height: 1.75rem;
  }

  .text h3 {
    margin: 0 0 0.25rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--immich-fg);
  }

  .text p {
    margin: 0;
    color: var(--immich-fg-muted);
    font-size: 0.875rem;
  }

  .drop-zone {
    border: 2px dashed var(--immich-border);
    border-radius: 0.75rem;
    padding: 3rem 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background: var(--immich-bg);
  }

  .drop-zone:hover,
  .drop-zone.dragging {
    border-color: var(--immich-primary);
    background: var(--immich-bg-hover);
  }

  .drop-zone.dragging {
    transform: scale(1.01);
  }

  .hidden-input {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .drop-zone-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .drop-icon {
    width: 3rem;
    height: 3rem;
    color: var(--immich-fg-muted);
    margin-bottom: 0.5rem;
  }

  .drop-text {
    margin: 0;
    font-size: 1rem;
    color: var(--immich-fg);
  }

  .drop-subtext {
    margin: 0;
    font-size: 0.875rem;
    color: var(--immich-fg-muted);
  }

  .file-list {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--immich-border);
  }

  .file-list h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--immich-fg);
  }

  .file-list ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .file-list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.625rem 0.75rem;
    background: var(--immich-bg-hover);
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .file-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
  }

  .file-icon {
    width: 1.25rem;
    height: 1.25rem;
    color: var(--immich-primary);
    flex-shrink: 0;
  }

  .file-name {
    font-size: 0.875rem;
    color: var(--immich-fg);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .file-size {
    font-size: 0.75rem;
    color: var(--immich-fg-muted);
    flex-shrink: 0;
  }

  .remove-btn {
    padding: 0.25rem;
    background: transparent;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    color: var(--immich-fg-muted);
    transition: all 0.15s ease;
  }

  .remove-btn:hover {
    background: var(--immich-danger-bg);
    color: var(--immich-danger);
  }

  .remove-btn svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .total-size {
    margin-top: 0.75rem;
    font-size: 0.8125rem;
    color: var(--immich-fg-muted);
    text-align: right;
  }
</style>
