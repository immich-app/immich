<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import GooglePhotosTakeoutLink from '$lib/components/utilities-page/google-photos/GooglePhotosTakeoutLink.svelte';
  import GooglePhotosDropZone from '$lib/components/utilities-page/google-photos/GooglePhotosDropZone.svelte';
  import GoogleDriveConnect from '$lib/components/utilities-page/google-photos/GoogleDriveConnect.svelte';
  import GooglePhotosImportProgress from '$lib/components/utilities-page/google-photos/GooglePhotosImportProgress.svelte';
  import { googlePhotosImportStore } from '$lib/stores/google-photos-import.store';
  import { Button } from '@immich/ui';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let isImporting = $state(false);
  let isGeneratingToken = $state(false);
  let setupToken = $state<{ token: string; expiresAt: string } | null>(null);
  let showAdvancedOptions = $state(false);

  // Handle OAuth callback URL parameters
  onMount(() => {
    const url = new URL(globalThis.location.href);
    const connected = url.searchParams.get('connected');
    const error = url.searchParams.get('error');

    if (connected === 'true') {
      googlePhotosImportStore.setGoogleDriveConnected(true);
      // Clean up URL
      url.searchParams.delete('connected');
      globalThis.history.replaceState({}, '', url.pathname);
      // Load files from Drive
      void loadDriveFiles();
    } else if (error) {
      googlePhotosImportStore.setError(decodeURIComponent(error));
      // Clean up URL
      url.searchParams.delete('error');
      globalThis.history.replaceState({}, '', url.pathname);
    }
  });

  async function loadDriveFiles() {
    try {
      const response = await fetch('/api/google-photos/google-drive/files?query=takeout');
      if (response.ok) {
        const data = await response.json();
        googlePhotosImportStore.setDriveFiles(data.files || []);
      }
    } catch (error) {
      console.error('Failed to load Drive files:', error);
    }
  }

  // Reactive store subscription
  let store = $state<typeof $googlePhotosImportStore>($googlePhotosImportStore);

  $effect(() => {
    const unsubscribe = googlePhotosImportStore.subscribe((v) => {
      store = v;
    });
    return unsubscribe;
  });

  const hasFilesToImport = $derived(
    store.selectedDriveFiles.length > 0 || store.uploadedFiles.length > 0
  );

  async function startImport() {
    if (!hasFilesToImport) {
      return;
    }

    isImporting = true;
    googlePhotosImportStore.setStep('processing');

    // Initialize progress
    googlePhotosImportStore.setProgress({
      phase: 'downloading',
      current: 0,
      total: store.uploadedFiles.length + store.selectedDriveFiles.length,
      albumsFound: 0,
      photosImported: 0,
      errors: [],
      events: [{ timestamp: new Date().toISOString(), type: 'info', message: 'Starting import...' }],
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
    // Get file sizes for volume sizing (ensure they're numbers, not strings)
    const fileSizes = fileIds.map((id) => {
      const file = store.driveFiles.find((f) => f.id === id);
      return Number(file?.size) || 0;
    });

    // Use the Fly worker endpoint for Google Drive imports
    const response = await fetch('/api/google-photos/import-from-drive-worker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds, fileSizes }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to import from Google Drive: ${error}`);
    }

    await pollImportProgress(await response.json());
  }

  function pollImportProgress(jobId: { id: string }) {
    // Poll for progress updates
    const pollInterval = setInterval(() => {
      void (async () => {
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
      })();
    }, 1000);
  }

  function handleComplete() {
    void goto('/photos');
  }

  function handleCancel() {
    googlePhotosImportStore.reset();
    isImporting = false;
  }

  function getPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('win')) {
      return 'windows-amd64';
    }
    if (userAgent.includes('mac')) {
      // Check for Apple Silicon
      if (userAgent.includes('arm') || navigator.platform === 'MacIntel') {
        return 'darwin-arm64';
      }
      return 'darwin-amd64';
    }
    return 'linux-amd64';
  }

  async function downloadImporter() {
    isGeneratingToken = true;

    try {
      // Generate setup token
      const response = await fetch('/api/importer/setup-token', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate setup token');
      }

      const tokenData = await response.json();
      setupToken = tokenData;

      // Download bootstrap binary
      const platform = getPlatform();
      const downloadUrl = `/api/importer/bootstrap/${tokenData.token}/${platform}`;

      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = platform.includes('windows') ? 'immich-importer-setup.exe' : 'immich-importer-setup';
      document.body.append(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download importer:', error);
      googlePhotosImportStore.setError(
        error instanceof Error ? error.message : 'Failed to download importer'
      );
    } finally {
      isGeneratingToken = false;
    }
  }
</script>

<UserPageLayout title={data.meta.title}>
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

          <!-- Desktop Importer - Recommended Option -->
          <div class="desktop-importer-card">
            <div class="card-header">
              <div class="recommended-badge">Recommended</div>
              <h3>Desktop Importer App</h3>
            </div>
            <p class="card-description">
              Download a small desktop app that handles the entire import process on your computer.
              Works with large libraries, can be paused and resumed, and runs faster than browser uploads.
            </p>
            <div class="card-features">
              <div class="feature">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                </svg>
                <span>Resumable - safe to close and restart</span>
              </div>
              <div class="feature">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                </svg>
                <span>Downloads directly from Google Drive</span>
              </div>
              <div class="feature">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                </svg>
                <span>Works with Takeout files still generating</span>
              </div>
            </div>
            <Button onclick={downloadImporter} color="primary" size="lg" disabled={isGeneratingToken}>
              {#if isGeneratingToken}
                <span class="spinner"></span>
                Preparing download...
              {:else}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 mr-2">
                  <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                  <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                </svg>
                Download Importer App
              {/if}
            </Button>
            {#if setupToken}
              <p class="token-info">
                App downloaded! Run it to start importing. Token valid until {new Date(setupToken.expiresAt).toLocaleDateString()}.
              </p>
            {/if}
          </div>

          <!-- Toggle for advanced options -->
          <button type="button" class="advanced-toggle" onclick={() => showAdvancedOptions = !showAdvancedOptions}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class:rotated={showAdvancedOptions}>
              <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clip-rule="evenodd" />
            </svg>
            {showAdvancedOptions ? 'Hide' : 'Show'} advanced import options
          </button>

          {#if showAdvancedOptions}
            <div class="advanced-options">
              <p class="advanced-description">
                These options process files through this Immich server. Use the desktop app above for large libraries.
              </p>
              <div class="options-grid">
                <GoogleDriveConnect />
                <div class="or-divider">
                  <span>OR</span>
                </div>
                <GooglePhotosDropZone />
              </div>
            </div>
          {/if}
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
          <button type="button" onclick={() => googlePhotosImportStore.setError(null)}>Dismiss</button>
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

  /* Desktop Importer Card */
  .desktop-importer-card {
    background: linear-gradient(135deg, var(--immich-bg) 0%, rgba(74, 144, 217, 0.05) 100%);
    border: 2px solid var(--immich-primary);
    border-radius: 1rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .recommended-badge {
    background: var(--immich-primary);
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .card-header h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--immich-fg);
  }

  .card-description {
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
    color: var(--immich-fg-muted);
    line-height: 1.5;
  }

  .card-features {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .feature {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--immich-fg);
  }

  .feature svg {
    width: 1.25rem;
    height: 1.25rem;
    color: var(--immich-primary);
    flex-shrink: 0;
  }

  .token-info {
    margin: 1rem 0 0 0;
    font-size: 0.875rem;
    color: var(--immich-primary);
    text-align: center;
  }

  /* Advanced Options Toggle */
  .advanced-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.75rem;
    background: transparent;
    border: 1px solid var(--immich-border);
    border-radius: 0.5rem;
    color: var(--immich-fg-muted);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .advanced-toggle:hover {
    background: var(--immich-bg);
    color: var(--immich-fg);
  }

  .advanced-toggle svg {
    width: 1.25rem;
    height: 1.25rem;
    transition: transform 0.2s;
  }

  .advanced-toggle svg.rotated {
    transform: rotate(180deg);
  }

  .advanced-options {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--immich-border);
  }

  .advanced-description {
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
    color: var(--immich-fg-muted);
    text-align: center;
  }
</style>
