<script lang="ts">
  import { googlePhotosImportStore, type ImportProgress } from '$lib/stores/google-photos-import.store';
  import { Button } from '@immich/ui';

  interface Props {
    onComplete?: () => void;
    onCancel?: () => void;
  }

  let { onComplete, onCancel }: Props = $props();

  const store = $derived.by(() => {
    let value: typeof $googlePhotosImportStore;
    googlePhotosImportStore.subscribe((v) => (value = v))();
    return value!;
  });

  const progress = $derived(store.progress);

  const progressPercent = $derived(
    progress && progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0,
  );

  const phaseLabels: Record<ImportProgress['phase'], string> = {
    downloading: 'Downloading from Google Drive...',
    extracting: 'Extracting ZIP files...',
    parsing: 'Matching photos with metadata...',
    uploading: 'Uploading to Immich...',
    complete: 'Import complete!',
  };

  const phaseIcons: Record<ImportProgress['phase'], string> = {
    downloading:
      'M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z',
    extracting:
      'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z',
    parsing:
      'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    uploading: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5',
    complete: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  };

  function handleComplete() {
    googlePhotosImportStore.reset();
    onComplete?.();
  }

  function handleCancel() {
    // Would need to call API to cancel the import job
    onCancel?.();
  }
</script>

<div class="progress-container">
  {#if progress}
    <div class="progress-header">
      <div class="phase-icon" class:complete={progress.phase === 'complete'}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d={phaseIcons[progress.phase]} />
        </svg>
      </div>
      <div class="phase-info">
        <h3>{phaseLabels[progress.phase]}</h3>
        {#if progress.currentFile && progress.phase !== 'complete'}
          <p class="current-file">{progress.currentFile}</p>
        {/if}
      </div>
    </div>

    {#if progress.phase !== 'complete'}
      <div class="progress-bar-container">
        <div class="progress-bar">
          <div class="progress-fill" style="width: {progressPercent}%"></div>
        </div>
        <span class="progress-text">{progressPercent}%</span>
      </div>

      <div class="progress-details">
        <span>{progress.current.toLocaleString()} / {progress.total.toLocaleString()}</span>
      </div>
    {/if}

    <div class="stats-grid">
      <div class="stat">
        <span class="stat-value">{progress.albumsFound}</span>
        <span class="stat-label">Albums</span>
      </div>
      <div class="stat">
        <span class="stat-value">{progress.photosMatched.toLocaleString()}</span>
        <span class="stat-label">With metadata</span>
      </div>
      <div class="stat">
        <span class="stat-value">{progress.photosMissingMetadata.toLocaleString()}</span>
        <span class="stat-label">Missing metadata</span>
      </div>
    </div>

    {#if progress.errors.length > 0}
      <div class="errors-section">
        <h4>Errors ({progress.errors.length})</h4>
        <ul>
          {#each progress.errors.slice(0, 5) as error, index (index)}
            <li>{error}</li>
          {/each}
          {#if progress.errors.length > 5}
            <li class="more">...and {progress.errors.length - 5} more</li>
          {/if}
        </ul>
      </div>
    {/if}

    <div class="actions">
      {#if progress.phase === 'complete'}
        <Button onclick={handleComplete} color="primary">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 mr-2">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clip-rule="evenodd"
            />
          </svg>
          Done
        </Button>
      {:else}
        <Button onclick={handleCancel} color="secondary">Cancel Import</Button>
      {/if}
    </div>
  {:else}
    <div class="no-progress">
      <p>No import in progress</p>
    </div>
  {/if}
</div>

<style>
  .progress-container {
    background: var(--immich-bg);
    border: 1px solid var(--immich-border);
    border-radius: 0.75rem;
    padding: 2rem;
  }

  .progress-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .phase-icon {
    flex-shrink: 0;
    width: 3rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--immich-primary-bg, #eff6ff);
    color: var(--immich-primary);
    border-radius: 50%;
  }

  .phase-icon.complete {
    background: var(--immich-success-bg, #ecfdf5);
    color: var(--immich-success, #059669);
  }

  .phase-icon svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  .phase-info h3 {
    margin: 0 0 0.25rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--immich-fg);
  }

  .current-file {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--immich-fg-muted);
    font-family: monospace;
    max-width: 400px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .progress-bar-container {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  .progress-bar {
    flex: 1;
    height: 0.75rem;
    background: var(--immich-bg-hover);
    border-radius: 9999px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--immich-primary);
    border-radius: 9999px;
    transition: width 0.3s ease;
  }

  .progress-text {
    flex-shrink: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--immich-fg);
    min-width: 3rem;
    text-align: right;
  }

  .progress-details {
    text-align: center;
    font-size: 0.8125rem;
    color: var(--immich-fg-muted);
    margin-bottom: 1.5rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .stat {
    text-align: center;
    padding: 1rem;
    background: var(--immich-bg-hover);
    border-radius: 0.5rem;
  }

  .stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--immich-fg);
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--immich-fg-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .errors-section {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--immich-danger-bg, #fef2f2);
    border-radius: 0.5rem;
  }

  .errors-section h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--immich-danger, #dc2626);
  }

  .errors-section ul {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.8125rem;
    color: var(--immich-danger, #dc2626);
  }

  .errors-section li {
    margin-bottom: 0.25rem;
  }

  .errors-section .more {
    font-style: italic;
    color: var(--immich-fg-muted);
  }

  .actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }

  .no-progress {
    text-align: center;
    padding: 2rem;
    color: var(--immich-fg-muted);
  }
</style>
