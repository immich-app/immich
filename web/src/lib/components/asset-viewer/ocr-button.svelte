<script lang="ts">
  import { ocrDataArray, showOcrOverlay } from '$lib/stores/ocr.store';
  import { getAssetOcr } from '@immich/sdk';
  import { IconButton } from '@immich/ui';
  import { mdiTextRecognition } from '@mdi/js';
  import { untrack } from 'svelte';

  interface Props {
    assetId: string;
  }

  let { assetId }: Props = $props();

  let isLoading = $state(false);
  let hasOcrData = $state<boolean | null>(null);
  let currentAssetId = $state<string>('');

  const checkOcrData = async (id: string) => {
    try {
      const ocrResults = await getAssetOcr({ id });
      console.log('OCR results for asset', id, ocrResults);
      
      untrack(() => {
        $ocrDataArray = ocrResults;
        hasOcrData = ocrResults.length > 0;
      });
    } catch (error) {
      console.error('Failed to check OCR data:', error);
      untrack(() => {
        hasOcrData = false;
      });
    }
  };

  const toggleOcrOverlay = () => {
    $showOcrOverlay = !$showOcrOverlay;
  };

  $effect(() => {
    // Only react to assetId changes
    if (assetId && assetId !== currentAssetId) {
      currentAssetId = assetId;
      
      // Reset state in untrack to avoid triggering the effect again
      untrack(() => {
        hasOcrData = null;
        $showOcrOverlay = false;
        $ocrDataArray = [];
      });
      
      // Check for OCR data
      void checkOcrData(assetId);
    }
  });
</script>

{#if hasOcrData === true}
  <IconButton
    title={$showOcrOverlay ? 'Hide text recognition' : 'Show text recognition'}
    icon={mdiTextRecognition}
    disabled={isLoading}
    class={$showOcrOverlay ? 'bg-immich-primary text-white' : ''}
    color="secondary"
    variant="ghost"
    shape="round"
    aria-label="Text recognition"
    onclick={toggleOcrOverlay}
  />
{/if}
