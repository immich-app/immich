<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import { transformManager } from '$lib/managers/edit/transform-manager.svelte';
  import { Button, HStack, IconButton } from '@immich/ui';
  import { mdiFlipHorizontal, mdiFlipVertical, mdiRotateLeft, mdiRotateRight } from '@mdi/js';
  import { clamp } from 'lodash-es';
  import { tick } from 'svelte';
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
    { label: $t('crop_aspect_ratio_square'), value: '1:1', width: 20, height: 20 },
  ];

  let isRotated = $derived(transformManager.normalizedRotation % 180 !== 0);
  let isLeftHanded = $derived(transformManager.mirrorHorizontal !== transformManager.mirrorVertical);
  let visualAngle = $derived(isLeftHanded ? -transformManager.straightenAngle : transformManager.straightenAngle);
  let isEditingStraightenAngle = $state(false);
  let straightenAngleInput = $state('');
  let straightenAngleInputElement = $state<HTMLInputElement>();

  function rotatedRatio(ratio: AspectRatioOption): string {
    if (ratio.value === 'free' || ratio.value === 'original') {
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
    const currentRatioRotated = rotatedRatio(ratio);

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

  async function editStraightenAngle() {
    straightenAngleInput = visualAngle.toFixed(1);
    isEditingStraightenAngle = true;
    await tick();
    straightenAngleInputElement?.focus();
    straightenAngleInputElement?.select();
  }

  function applyStraightenAngleInput() {
    const angle = Number(straightenAngleInput);

    isEditingStraightenAngle = false;

    if (!Number.isFinite(angle)) {
      return;
    }

    const clampedAngle = clamp(angle, -45, 45);
    transformManager.setStraightenAngle(isLeftHanded ? -clampedAngle : clampedAngle);
  }

  function cancelStraightenAngleInput() {
    isEditingStraightenAngle = false;
  }
</script>

<svelte:document
  use:shortcuts={[
    { shortcut: { key: ']' }, onShortcut: () => rotateImage(90) },
    { shortcut: { key: '[' }, onShortcut: () => rotateImage(-90) },
  ]}
/>

<div class="mt-3 px-4">
  <div class="mt-2 flex h-10 w-full items-center justify-between text-sm">
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

  <div class="mt-6 flex h-10 w-full items-center justify-between text-sm">
    <h2>{$t('editor_straighten')}</h2>
    {#if transformManager.straightenAngle !== 0}
      <button
        onclick={() => transformManager.setStraightenAngle(0)}
        class="text-xs text-primary hover:underline"
        type="button"
      >
        {$t('editor_straighten_reset')}
      </button>
    {/if}
  </div>
  <div class="mb-4 flex flex-col items-center px-2">
    <div class="mb-2 flex justify-center text-sm font-semibold text-primary">
      {#if isEditingStraightenAngle}
        <div class="relative">
          <input
            bind:this={straightenAngleInputElement}
            bind:value={straightenAngleInput}
            type="number"
            min="-45"
            max="45"
            step="0.1"
            aria-label={$t('editor_straighten')}
            class="w-16 rounded-sm border border-primary bg-transparent px-1 py-0 text-center text-sm font-semibold text-primary outline-none"
            onblur={applyStraightenAngleInput}
            onkeydown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyStraightenAngleInput();
              }

              if (e.key === 'Escape') {
                e.preventDefault();
                cancelStraightenAngleInput();
              }
            }}
          />
          <span class="absolute top-0 left-full">°</span>
        </div>
      {:else}
        <button
          class="relative cursor-text"
          type="button"
          onclick={editStraightenAngle}
          aria-label={$t('editor_straighten')}
        >
          {visualAngle > 0 ? '+' : ''}{visualAngle.toFixed(1)}<span class="absolute top-0 left-full">°</span>
        </button>
      {/if}
    </div>
    <div class="relative flex w-full items-center">
      <div class="pointer-events-none absolute top-1/2 left-1/2 h-4 w-0.5 -translate-1/2 bg-white/20"></div>

      <input
        type="range"
        min="-45"
        max="45"
        step="0.5"
        value={visualAngle}
        oninput={(e) => {
          transformManager.isInteracting = true;
          const val = Number((e.target as HTMLInputElement).value);
          transformManager.setStraightenAngle(isLeftHanded ? -val : val);
        }}
        onchange={() => {
          transformManager.isInteracting = false;
        }}
        onmousedown={() => {
          transformManager.isInteracting = true;
        }}
        onmouseup={() => {
          transformManager.isInteracting = false;
        }}
        ontouchstart={() => {
          transformManager.isInteracting = true;
        }}
        ontouchend={() => {
          transformManager.isInteracting = false;
        }}
        class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-primary focus:outline-none"
      />
    </div>
    <div class="mt-1 grid w-full grid-cols-3 text-[10px] text-gray-400">
      <span class="text-left">-45°</span>
      <span class="text-center">
        <span class="relative inline-block">
          0<span class="absolute top-0 left-full">°</span>
        </span>
      </span>
      <span class="text-right">+45°</span>
    </div>
  </div>

  <div class="mt-6 flex h-10 w-full items-center justify-between text-sm">
    <h2>{$t('crop')}</h2>
  </div>

  <!-- Aspect Ratio Grid -->
  <div class="mb-4 grid grid-cols-2">
    {#each aspectRatios as ratio (ratio.value)}
      <HStack>
        <Button
          class="m-2 size-14"
          shape="round"
          onclick={() => selectAspectRatio(ratio)}
          aria-label={ratio.label}
          color={ratioSelected(ratio) ? 'primary' : 'secondary'}
          variant={ratioSelected(ratio) ? 'filled' : 'outline'}
        >
          {#if ratio.isFree}
            <!-- Free crop icon with dashed border -->
            <div
              class="size-6 shrink-0 rounded-xs border-2 border-dashed {ratioSelected(ratio)
                ? 'border-black'
                : 'border-white'}"
            ></div>
          {:else}
            <!-- Aspect ratio box -->
            <div
              class="shrink-0 rounded-xs border-2 {ratioSelected(ratio) ? 'border-black' : 'border-white'}"
              style="width: {ratio.width}px; height: {ratio.height}px;"
            ></div>
          {/if}
        </Button>
        <span class="text-sm text-white">{ratio.label}</span>
      </HStack>
    {/each}
  </div>
</div>
