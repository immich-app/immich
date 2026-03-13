<script lang="ts">
  import { ImportManager, ImportStep } from '$lib/managers/import-manager.svelte';
  import type { ImportOptions } from '$lib/managers/import-manager.svelte';
  import { scanTakeoutFiles } from '$lib/utils/google-takeout-scanner';
  import type { ScanResult } from '$lib/utils/google-takeout-scanner';
  import { createImportAlbums, uploadTakeoutItem } from '$lib/utils/google-takeout-uploader';
  import { Container } from '@immich/ui';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';
  import ImportFilesStep from './import-files-step.svelte';
  import ImportProgressStep from './import-progress-step.svelte';
  import ImportReviewStep from './import-review-step.svelte';
  import ImportScanStep from './import-scan-step.svelte';
  import ImportSourceStep from './import-source-step.svelte';
  import ImportStepIndicator from './import-step-indicator.svelte';

  const manager = new ImportManager();

  let abortController: AbortController | undefined = $state(undefined);

  async function startScan() {
    manager.currentStep = ImportStep.Scan;
    manager.scanProgress = undefined;

    abortController = new AbortController();

    try {
      const result: ScanResult = await scanTakeoutFiles({
        files: manager.selectedFiles,
        onProgress: (progress) => {
          manager.scanProgress = { ...progress, albumNames: new SvelteSet(progress.albumNames) };
        },
        signal: abortController.signal,
      });

      manager.scanResult = result;
      manager.setAlbums(result.albums);
      manager.currentStep = ImportStep.Review;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        // User cancelled — stay on files step (previousStep already called in onCancel)
        return;
      }
      console.error('Scan failed:', error);
      manager.currentStep = ImportStep.Files;
    }
  }

  function cancelScan() {
    abortController?.abort();
    manager.previousStep();
  }

  async function startImport() {
    if (!manager.scanResult) {
      return;
    }

    manager.currentStep = ImportStep.Import;
    const items = manager.scanResult.items;
    const assetIdMap = new SvelteMap<string, string>();

    manager.importProgress = {
      imported: 0,
      skipped: 0,
      errors: 0,
      total: items.length,
      currentFile: '',
      currentAlbum: '',
      albumsCreated: 0,
      errorLog: [],
    };

    // Upload items one by one
    for (const item of items) {
      // Respect pause
      while (manager.isPaused) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      manager.importProgress = {
        ...manager.importProgress,
        currentFile: item.file.name,
      };

      const result = await uploadTakeoutItem(item, manager.options);

      if (result.status === 'imported') {
        manager.trackImported();
        assetIdMap.set(item.path, result.assetId);
      } else if (result.status === 'duplicate') {
        manager.trackSkipped();
        if (result.assetId) {
          assetIdMap.set(item.path, result.assetId);
        }
      } else {
        manager.trackError(item.file.name, result.error ?? 'Unknown error');
      }
    }

    // Create albums
    if (manager.selectedAlbums.size > 0) {
      const albumCount = await createImportAlbums(items, assetIdMap, manager.selectedAlbums);
      manager.importProgress = {
        ...manager.importProgress,
        albumsCreated: albumCount,
      };
    }

    manager.isComplete = true;
  }

  function handleSetOption(key: string, value: boolean) {
    manager.setOption(key as keyof ImportOptions, value);
  }
</script>

<Container size="large" center>
  <div class="flex flex-col gap-6 py-8">
    <ImportStepIndicator currentStep={manager.currentStep} />

    {#if manager.currentStep === ImportStep.Source}
      <ImportSourceStep onNext={() => manager.nextStep()} />
    {:else if manager.currentStep === ImportStep.Files}
      <ImportFilesStep
        files={manager.selectedFiles}
        totalSize={manager.totalSize}
        onAddFiles={(files) => manager.addFiles(files)}
        onClearFiles={() => manager.clearFiles()}
        onNext={startScan}
        onBack={() => manager.previousStep()}
      />
    {:else if manager.currentStep === ImportStep.Scan}
      <ImportScanStep progress={manager.scanProgress} onCancel={cancelScan} />
    {:else if manager.currentStep === ImportStep.Review}
      {#if manager.scanResult}
        <ImportReviewStep
          items={manager.scanResult.items}
          albums={manager.scanResult.albums}
          selectedAlbums={manager.selectedAlbums}
          options={manager.options}
          stats={manager.scanResult.stats}
          onToggleAlbum={(name) => manager.toggleAlbum(name)}
          onSelectAllAlbums={() => manager.selectAllAlbums()}
          onDeselectAllAlbums={() => manager.deselectAllAlbums()}
          onSetOption={handleSetOption}
          onImport={startImport}
          onBack={() => manager.previousStep()}
        />
      {/if}
    {:else if manager.currentStep === ImportStep.Import}
      <ImportProgressStep
        progress={manager.importProgress}
        total={manager.scanResult?.items.length ?? 0}
        isPaused={manager.isPaused}
        isComplete={manager.isComplete}
        onTogglePause={() => manager.togglePause()}
      />
    {/if}
  </div>
</Container>
