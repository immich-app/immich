<script lang="ts">
  import { transformManager } from '$lib/managers/edit/transform-manager.svelte';
  import { Button, HStack, IconButton } from '@immich/ui';
  import { mdiFlipHorizontal, mdiFlipVertical, mdiRotateLeft, mdiRotateRight } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface AspectRatioOption {
    label: string;
    value: string;
    width?: number;
    height?: number;
    isFree?: boolean;
  }

  const aspectRatios: AspectRatioOption[] = [
    { label: $t('crop_aspect_ratio_free'), value: 'free', isFree: true },
    { label: $t('crop_aspect_ratio_original'), value: 'original', width: 24, height: 18 },
    { label: '5:4', value: '5:4', width: 22, height: 18 },
    { label: '4:5', value: '4:5', width: 18, height: 22 },
    { label: '4:3', value: '4:3', width: 24, height: 18 },
    { label: '3:4', value: '3:4', width: 18, height: 24 },
    { label: '3:2', value: '3:2', width: 24, height: 16 },
    { label: '2:3', value: '2:3', width: 16, height: 24 },
    { label: '16:9', value: '16:9', width: 24, height: 14 },
    { label: '9:16', value: '9:16', width: 14, height: 24 },
    { label: 'Square', value: '1:1', width: 20, height: 20 },
  ];

  let isRotated = $derived(transformManager.normalizedRotation % 180 !== 0);

  function rotatedRatio(ratio: AspectRatioOption): string {
    if (ratio.value === 'free') {
      return ratio.value;
    }

    if (isRotated) {
      let [width, height] = ratio.value.split(':');
      return `${height}:${width}`;
    } else {
      return ratio.value;
    }
  }

  function ratioSelected(ratio: AspectRatioOption): boolean {
    let currentRatioRotated;
    if (ratio.value === 'original') {
      const { width, height } = transformManager.cropImageSize;
      // Account for rotation when comparing to original
      if (isRotated) {
        currentRatioRotated = `${height}:${width}`;
      }
      currentRatioRotated = `${width}:${height}`;
    }
    currentRatioRotated = rotatedRatio(ratio);

    return transformManager.cropAspectRatio === currentRatioRotated;
  }

  function selectAspectRatio(ratio: AspectRatioOption) {
    let appliedRatio;
    if (ratio.value === 'original') {
      const { width, height } = transformManager.cropImageSize;
      appliedRatio = `${width}:${height}`;
    } else {
      appliedRatio = rotatedRatio(ratio);
    }

    transformManager.setAspectRatio(appliedRatio);
  }

  async function rotateImage(degrees: number) {
    await transformManager.rotate(degrees);
  }

  function mirrorImage(axis: 'horizontal' | 'vertical') {
    transformManager.mirror(axis);
  }
</script>

<div class="mt-3 px-4">
  <div class="flex h-10 w-full items-center justify-between text-sm mt-2">
    <h2>{$t('editor_orientation')}</h2>
  </div>
  <HStack>
    <IconButton
      class="w-full"
      size="small"
      aria-label={$t('editor_rotate_left')}
      icon={mdiRotateLeft}
      onclick={() => rotateImage(-90)}
    />
    <IconButton
      class="w-full"
      size="small"
      aria-label={$t('editor_rotate_right')}
      icon={mdiRotateRight}
      onclick={() => rotateImage(90)}
    />
    <IconButton
      class="w-full"
      size="small"
      aria-label={$t('editor_flip_horizontal')}
      icon={mdiFlipHorizontal}
      onclick={() => mirrorImage('horizontal')}
    />
    <IconButton
      class="w-full"
      size="small"
      aria-label={$t('editor_flip_vertical')}
      icon={mdiFlipVertical}
      onclick={() => mirrorImage('vertical')}
    />
  </HStack>

  <div class="flex h-10 w-full items-center justify-between text-sm mt-6">
    <h2>{$t('crop')}</h2>
  </div>

  <!-- Aspect Ratio Grid -->
  <div class="grid grid-cols-2 mb-4">
    {#each aspectRatios as ratio (ratio.value)}
      <HStack>
        <Button
          class="w-14 h-14 m-2"
          shape="round"
          onclick={() => selectAspectRatio(ratio)}
          aria-label={ratio.label}
          color={ratioSelected(ratio) ? 'primary' : 'secondary'}
          variant={ratioSelected(ratio) ? 'filled' : 'outline'}
        >
          {#if ratio.isFree}
            <!-- Free crop icon with dashed border -->
            <div
              class="w-6 h-6 border-2 border-dashed rounded-xs flex-shrink-0 {ratioSelected(ratio)
                ? 'border-black'
                : 'border-white'}"
            ></div>
          {:else}
            <!-- Aspect ratio box -->
            <div
              class="border-2 rounded-xs flex-shrink-0 {ratioSelected(ratio) ? 'border-black' : 'border-white'}"
              style="width: {ratio.width}px; height: {ratio.height}px;"
            ></div>
          {/if}
        </Button>
        <span class="text-sm text-white text-left">{ratio.label}</span>
      </HStack>
    {/each}
  </div>
</div>
