<script lang="ts">
  import { goto } from '$app/navigation';
  import GooglePhotosTakeoutLink from '$lib/components/utilities-page/google-photos/GooglePhotosTakeoutLink.svelte';
  import GooglePhotosDropZone from '$lib/components/utilities-page/google-photos/GooglePhotosDropZone.svelte';
  import GoogleDriveConnect from '$lib/components/utilities-page/google-photos/GoogleDriveConnect.svelte';
  import GooglePhotosImportProgress from '$lib/components/utilities-page/google-photos/GooglePhotosImportProgress.svelte';
  import { googlePhotosImportStore } from '$lib/stores/google-photos-import.store';
  import { Button } from '@immich/ui';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';

  let isImporting = $state(false);

  const store = $derived.by(() => {
    let value: typeof $googlePhotosImportStore;
    googlePhotosImportStore.subscribe((v) => (value = v))();
    return value!;
  });

  const hasFilesToImport = $derived(
    store.selectedDriveFiles.length > 0 || store.uploadedFiles.length > 0
  );

  async function startImport() {
    if (!hasFilesToImport) return;

    isImporting = true;
    googlePhotosImportStore.setStep('processing');

    // Initialize progress
    googlePhotosImportStore.setProgress({
      phase: 'extracting',
      current: 0,
      total: store.uploadedFiles.length + store.selectedDriveFiles.length,
      albumsFound: 0,
      photosMatched: 0,
      photosMissingMetadata: 0,
      errors: [],
    });

    try {
      if (store.uploadedFiles.length > 0) {
        await importFromFiles(store.uploadedFiles);
      }

      if (store.selectedDriveFiles.length > 0) {
        await importFromDrive(store.selectedDriveFiles);
      }

      googlePhotosImportStore.updateProgress({ phase: 'complete' });
    } catch (error) {
      console.error('Import failed:', error);
      googlePhotosImportStore.setError(
        error instanceof Error ? error.message : 'Import failed'
      );
    } finally {
      isImporting = false;
    }
  }

  async function importFromFiles(files: File[]) {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }

    const response = await fetch('/api/google-photos/import', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload files');
    }

    // Stream progress updates via SSE or polling
    await pollImportProgress(await response.json());
  }

  async function importFromDrive(fileIds: string[]) {
    const response = await fetch('/api/google-photos/import-from-drive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to import from Google Drive');
    }

    await pollImportProgress(await response.json());
  }

  async function pollImportProgress(jobId: { id: string }) {
    // Poll for progress updates
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/google-photos/import/${jobId.id}/progress`);
        if (!response.ok) {
          clearInterval(pollInterval);
          return;
        }

        const progress = await response.json();
        googlePhotosImportStore.setProgress(progress);

        if (progress.phase === 'complete') {
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Failed to poll progress:', error);
        clearInterval(pollInterval);
      }
    }, 1000);
  }

  function handleComplete() {
    goto('/photos');
  }

  function handleCancel() {
    googlePhotosImportStore.reset();
    isImporting = false;
  }
</script>

<UserPageLayout title="Import from Google Photos">
  <svelte:fragment slot="buttons">
    <Button href="/utilities" color="secondary" size="sm">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 mr-1">
        <path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd" />
      </svg>
      Back
    </Button>
  </svelte:fragment>

  <div class="import-container">
    {#if store.step === 'processing' || isImporting}
      <GooglePhotosImportProgress onComplete={handleComplete} onCancel={handleCancel} />
    {:else}
      <div class="intro-section">
        <div class="intro-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
          </svg>
        </div>
        <h1>Import from Google Photos</h1>
        <p>
          Transfer your photos and videos from Google Photos to Immich.
          Your albums, dates, locations, and descriptions will be preserved.
        </p>
      </div>

      <div class="steps-container">
        <GooglePhotosTakeoutLink />

        <div class="import-options">
          <h2>Step 2: Import your Takeout files</h2>
          <p class="options-description">
            Choose how to import your Google Takeout files:
          </p>

          <div class="options-grid">
            <GoogleDriveConnect />
            <div class="or-divider">
              <span>OR</span>
            </div>
            <GooglePhotosDropZone />
          </div>
        </div>
      </div>

      {#if hasFilesToImport}
        <div class="import-action">
          <Button onclick={startImport} color="primary" size="lg" disabled={isImporting}>
            {#if isImporting}
              <span class="spinner"></span>
              Starting import...
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 mr-2">
                <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
              </svg>
              Start Import
            {/if}
          </Button>
          <p class="import-summary">
            Ready to import {store.uploadedFiles.length + store.selectedDriveFiles.length} file{store.uploadedFiles.length + store.selectedDriveFiles.length === 1 ? '' : 's'}
          </p>
        </div>
      {/if}

      {#if store.error}
        <div class="error-banner">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
          </svg>
          <span>{store.error}</span>
          <button onclick={() => googlePhotosImportStore.setError(null)}>Dismiss</button>
        </div>
      {/if}
    {/if}
  </div>
</UserPageLayout>

<style>
  .import-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .intro-section {
    text-align: center;
    margin-bottom: 3rem;
  }

  .intro-icon {
    width: 4rem;
    height: 4rem;
    margin: 0 auto 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #4285f4, #34a853, #fbbc05, #ea4335);
    border-radius: 1rem;
  }

  .intro-icon svg {
    width: 2.5rem;
    height: 2.5rem;
    color: white;
  }

  .intro-section h1 {
    margin: 0 0 0.75rem 0;
    font-size: 1.875rem;
    font-weight: 700;
    color: var(--immich-fg);
  }

  .intro-section p {
    margin: 0;
    font-size: 1rem;
    color: var(--immich-fg-muted);
    max-width: 500px;
    margin: 0 auto;
  }

  .steps-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .import-options h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--immich-fg);
  }

  .options-description {
    margin: 0 0 1.5rem 0;
    font-size: 0.875rem;
    color: var(--immich-fg-muted);
  }

  .options-grid {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .or-divider {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .or-divider::before,
  .or-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--immich-border);
  }

  .or-divider span {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--immich-fg-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .import-action {
    margin-top: 2rem;
    text-align: center;
    padding: 2rem;
    background: var(--immich-bg);
    border: 1px solid var(--immich-border);
    border-radius: 0.75rem;
  }

  .import-summary {
    margin: 1rem 0 0 0;
    font-size: 0.875rem;
    color: var(--immich-fg-muted);
  }

  .spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-right: 0.5rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .error-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding: 1rem;
    background: var(--immich-danger-bg, #fef2f2);
    border: 1px solid var(--immich-danger, #dc2626);
    border-radius: 0.5rem;
    color: var(--immich-danger, #dc2626);
    font-size: 0.875rem;
  }

  .error-banner svg {
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
  }

  .error-banner span {
    flex: 1;
  }

  .error-banner button {
    padding: 0.25rem 0.75rem;
    background: transparent;
    border: 1px solid currentColor;
    border-radius: 0.25rem;
    color: inherit;
    font-size: 0.8125rem;
    cursor: pointer;
  }

  .error-banner button:hover {
    background: var(--immich-danger);
    color: white;
  }
</style>
