<script lang="ts">
  import { googlePhotosImportStore, type GoogleDriveFile } from '$lib/stores/google-photos-import.store';
  import { Button, Checkbox } from '@immich/ui';
  import byteSize from 'byte-size';

  interface Props {
    onDisconnect?: () => void;
  }

  let { onDisconnect }: Props = $props();

  let isConnecting = $state(false);
  let isLoadingFiles = $state(false);

  const store = $derived.by(() => {
    let value: typeof $googlePhotosImportStore;
    googlePhotosImportStore.subscribe((v) => (value = v))();
    return value!;
  });

  // Filter for Takeout ZIP files
  const takeoutFiles = $derived(
    store.driveFiles.filter(
      (f) =>
        f.name.toLowerCase().startsWith('takeout-') &&
        (f.name.toLowerCase().endsWith('.zip') || f.mimeType === 'application/zip'),
    ),
  );

  async function connectGoogleDrive() {
    isConnecting = true;

    try {
      // Get the OAuth URL from the server
      const response = await fetch('/api/google-photos/google-drive/auth', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to connect to Google Drive');
      }

      const { authUrl } = await response.json();

      // Redirect to Google OAuth
      globalThis.location.href = authUrl;
    } catch (error) {
      console.error('Failed to connect:', error);
      googlePhotosImportStore.setError(
        error instanceof Error ? error.message : 'Failed to connect to Google Drive. Please try again.',
      );
      isConnecting = false;
    }
  }

  async function disconnectGoogleDrive() {
    try {
      await fetch('/api/google-photos/google-drive/auth', { method: 'DELETE' });
      googlePhotosImportStore.setGoogleDriveConnected(false);
      googlePhotosImportStore.setDriveFiles([]);
      googlePhotosImportStore.deselectAllDriveFiles();
      onDisconnect?.();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  }

  async function loadDriveFiles() {
    isLoadingFiles = true;

    try {
      // Search for Takeout files in Drive
      const response = await fetch('/api/google-photos/google-drive/files?query=takeout');

      if (!response.ok) {
        throw new Error('Failed to load files');
      }

      const files: GoogleDriveFile[] = await response.json();
      googlePhotosImportStore.setDriveFiles(files);
    } catch (error) {
      console.error('Failed to load files:', error);
      googlePhotosImportStore.setError('Failed to load files from Google Drive');
    } finally {
      isLoadingFiles = false;
    }
  }

  function toggleFile(fileId: string) {
    googlePhotosImportStore.toggleDriveFile(fileId);
  }

  function selectAll() {
    googlePhotosImportStore.selectAllDriveFiles();
  }

  function deselectAll() {
    googlePhotosImportStore.deselectAllDriveFiles();
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
</script>

<div class="drive-connect-container">
  <div class="header">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 87.3 78" class="drive-logo">
        <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
        <path d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3L1.2 52.35c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47" />
        <path
          d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.1c.8-1.4 1.2-2.95 1.2-4.5H59.85L73.55 76.8z"
          fill="#ea4335"
        />
        <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
        <path
          d="M59.85 52.6h27.5c0-1.55-.4-3.1-1.2-4.5L73.55 26.8l-3.85-6.65c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.2 27.6z"
          fill="#2684fc"
        />
        <path
          d="M73.4 26.85L43.65 25 27.5 52.6h32.35l13.55 23.8c1.35-.8 2.5-1.9 3.3-3.3l3.85-6.65L73.4 26.85z"
          fill="#ffba00"
        />
      </svg>
    </div>
    <div class="text">
      <h3>Google Drive Import</h3>
      <p>
        {#if store.isGoogleDriveConnected}
          Auto-import Takeout files from your Google Drive
        {:else}
          Connect to import Takeout files directly from Drive
        {/if}
      </p>
    </div>
  </div>

  {#if !store.isGoogleDriveConnected}
    <div class="connect-section">
      <p class="connect-description">
        If you selected "Add to Drive" in Google Takeout, your export files will appear here automatically.
      </p>
      <Button onclick={connectGoogleDrive} color="primary" disabled={isConnecting}>
        {#if isConnecting}
          <span class="spinner"></span>
          Connecting...
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 mr-2">
            <path
              fill-rule="evenodd"
              d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
              clip-rule="evenodd"
            />
          </svg>
          Connect Google Drive
        {/if}
      </Button>
    </div>
  {:else}
    <div class="connected-section">
      <div class="connected-status">
        <span class="status-badge">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clip-rule="evenodd"
            />
          </svg>
          Connected
        </span>
        <button type="button" class="disconnect-btn" onclick={disconnectGoogleDrive}>Disconnect</button>
      </div>

      {#if isLoadingFiles}
        <div class="loading">
          <span class="spinner"></span>
          Searching for Takeout files...
        </div>
      {:else if takeoutFiles.length === 0}
        <div class="no-files">
          <p>No Takeout files found in your Google Drive.</p>
          <p class="hint">Make sure you selected "Add to Drive" when creating your export in Google Takeout.</p>
          <Button onclick={loadDriveFiles} size="small">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 mr-1">
              <path
                fill-rule="evenodd"
                d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
                clip-rule="evenodd"
              />
            </svg>
            Refresh
          </Button>
        </div>
      {:else}
        <div class="file-list">
          <div class="file-list-header">
            <h4>Found {takeoutFiles.length} Takeout file{takeoutFiles.length === 1 ? '' : 's'}</h4>
            <div class="selection-actions">
              <button type="button" class="link-btn" onclick={selectAll}>Select all</button>
              <span class="separator">|</span>
              <button type="button" class="link-btn" onclick={deselectAll}>Deselect all</button>
            </div>
          </div>

          <ul>
            {#each takeoutFiles as file (file.id)}
              <li>
                <label class="file-row">
                  <Checkbox checked={store.selectedDriveFiles.includes(file.id)} onchange={() => toggleFile(file.id)} />
                  <div class="file-info">
                    <span class="file-name">{file.name}</span>
                    <span class="file-meta">
                      {byteSize(file.size).toString()} • {formatDate(file.createdTime)}
                    </span>
                  </div>
                </label>
              </li>
            {/each}
          </ul>

          {#if store.selectedDriveFiles.length > 0}
            <div class="selection-summary">
              {store.selectedDriveFiles.length} file{store.selectedDriveFiles.length === 1 ? '' : 's'} selected ({byteSize(
                takeoutFiles.filter((f) => store.selectedDriveFiles.includes(f.id)).reduce((sum, f) => sum + f.size, 0),
              ).toString()})
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .drive-connect-container {
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
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 0.5rem;
  }

  .drive-logo {
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

  .connect-section {
    text-align: center;
    padding: 1rem 0;
  }

  .connect-description {
    margin: 0 0 1.25rem 0;
    color: var(--immich-fg-muted);
    font-size: 0.875rem;
  }

  .connected-section {
    padding-top: 0.5rem;
  }

  .connected-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: var(--immich-success-bg, #ecfdf5);
    border-radius: 0.5rem;
    margin-bottom: 1rem;
  }

  .status-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--immich-success, #059669);
    font-weight: 500;
    font-size: 0.875rem;
  }

  .status-badge svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .disconnect-btn {
    padding: 0.375rem 0.75rem;
    background: transparent;
    border: 1px solid var(--immich-border);
    border-radius: 0.375rem;
    font-size: 0.8125rem;
    color: var(--immich-fg-muted);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .disconnect-btn:hover {
    border-color: var(--immich-danger);
    color: var(--immich-danger);
  }

  .loading,
  .no-files {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--immich-fg-muted);
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }

  .no-files p {
    margin: 0 0 0.5rem 0;
  }

  .no-files .hint {
    font-size: 0.8125rem;
    margin-bottom: 1rem;
  }

  .spinner {
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid var(--immich-border);
    border-top-color: var(--immich-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .file-list {
    margin-top: 1rem;
  }

  .file-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .file-list-header h4 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--immich-fg);
  }

  .selection-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
  }

  .link-btn {
    background: none;
    border: none;
    color: var(--immich-primary);
    cursor: pointer;
    padding: 0;
    font-size: inherit;
  }

  .link-btn:hover {
    text-decoration: underline;
  }

  .separator {
    color: var(--immich-border);
  }

  .file-list ul {
    margin: 0;
    padding: 0;
    list-style: none;
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid var(--immich-border);
    border-radius: 0.5rem;
  }

  .file-list li {
    border-bottom: 1px solid var(--immich-border);
  }

  .file-list li:last-child {
    border-bottom: none;
  }

  .file-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .file-row:hover {
    background: var(--immich-bg-hover);
  }

  .file-info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
  }

  .file-name {
    font-size: 0.875rem;
    color: var(--immich-fg);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .file-meta {
    font-size: 0.75rem;
    color: var(--immich-fg-muted);
  }

  .selection-summary {
    margin-top: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: var(--immich-primary-bg, #eff6ff);
    border-radius: 0.375rem;
    font-size: 0.8125rem;
    color: var(--immich-primary);
    text-align: center;
  }
</style>
