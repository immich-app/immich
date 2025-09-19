<script lang="ts">
  import {
    cropAspectRatio,
    cropImageScale,
    cropImageSize,
    cropSettings,
    cropSettingsChanged,
    normaizedRorateDegrees,
    rotateDegrees,
    type CropAspectRatio,
  } from '$lib/stores/asset-editor.store';
  import { IconButton } from '@immich/ui';
  import { mdiBackupRestore, mdiCropFree, mdiRotateLeft, mdiRotateRight, mdiSquareOutline } from '@mdi/js';
  import { tick } from 'svelte';
  import { t } from 'svelte-i18n';
  import CropPreset from './crop-preset.svelte';
  import { onImageLoad } from './image-loading';

  let rotateHorizontal = $derived([90, 270].includes($normaizedRorateDegrees));
  const icon_16_9 = `M200-280q-33 0-56.5-23.5T120-360v-240q0-33 23.5-56.5T200-680h560q33 0 56.5 23.5T840-600v240q0 33-23.5 56.5T760-280H200Zm0-80h560v-240H200v240Zm0 0v-240 240Z`;
  const icon_4_3 = `M19 5H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 12H5V7h14v10z`;
  const icon_3_2 = `M200-240q-33 0-56.5-23.5T120-320v-320q0-33 23.5-56.5T200-720h560q33 0 56.5 23.5T840-640v320q0 33-23.5 56.5T760-240H200Zm0-80h560v-320H200v320Zm0 0v-320 320Z`;
  const icon_7_5 = `M200-200q-33 0-56.5-23.5T120-280v-400q0-33 23.5-56.5T200-760h560q33 0 56.5 23.5T840-680v400q0 33-23.5 56.5T760-200H200Zm0-80h560v-400H200v400Zm0 0v-400 400Z`;
  interface Size {
    icon: string;
    name: CropAspectRatio;
    viewBox: string;
    rotate?: boolean;
  }
  let sizes: Size[] = [
    {
      icon: mdiCropFree,
      name: 'free',
      viewBox: '0 0 24 24',
      rotate: false,
    },
    {
      name: '1:1',
      icon: mdiSquareOutline,
      viewBox: '0 0 24 24',
      rotate: false,
    },
    {
      name: '16:9',
      icon: icon_16_9,
      viewBox: '50 -700 840 400',
    },
    {
      name: '4:3',
      icon: icon_4_3,
      viewBox: '0 0 24 24',
    },
    {
      name: '3:2',
      icon: icon_3_2,
      viewBox: '50 -720 840 480',
    },
    {
      name: '7:5',
      icon: icon_7_5,
      viewBox: '50 -760 840 560',
    },
    {
      name: '9:16',
      icon: icon_16_9,
      viewBox: '50 -700 840 400',
      rotate: true,
    },
    {
      name: '3:4',
      icon: icon_4_3,
      viewBox: '0 0 24 24',
      rotate: true,
    },
    {
      name: '2:3',
      icon: icon_3_2,
      viewBox: '50 -720 840 480',
      rotate: true,
    },
    {
      name: '5:7',
      icon: icon_7_5,
      viewBox: '50 -760 840 560',
      rotate: true,
    },
    {
      name: 'reset',
      icon: mdiBackupRestore,
      viewBox: '0 0 24 24',
      rotate: false,
    },
  ];

  let selectedSize: CropAspectRatio = $state('free');

  $effect(() => {
    $cropAspectRatio = selectedSize;
  });

  let sizesRows = $derived([
    sizes.filter((s) => s.rotate === false),
    sizes.filter((s) => s.rotate === undefined),
    sizes.filter((s) => s.rotate === true),
  ]);

  async function rotate(clock: boolean) {
    rotateDegrees.update((v) => {
      return v + 90 * (clock ? 1 : -1);
    });

    await tick();
    onImageLoad();
  }

  function selectType(size: CropAspectRatio) {
    if (size === 'reset') {
      selectedSize = 'free';
      let cropImageSizeM = $cropImageSize;
      let cropImageScaleM = $cropImageScale;
      $cropSettings = {
        x: 0,
        y: 0,
        width: cropImageSizeM[0] * cropImageScaleM - 1,
        height: cropImageSizeM[1] * cropImageScaleM - 1,
      };
      $cropAspectRatio = selectedSize;
      $cropSettingsChanged = false;
      return;
    }
    selectedSize = size;
    $cropAspectRatio = size;
  }
</script>

<div class="mt-3 px-4 py-4">
  <div class="flex h-10 w-full items-center justify-between text-sm">
    <h2 class="uppercase">{$t('editor_crop_tool_h2_aspect_ratios')}</h2>
  </div>
  {#each sizesRows as sizesRow, index (index)}
    <ul class="flex-wrap flex-row flex gap-x-6 py-2 justify-evenly">
      {#each sizesRow as size (size.name)}
        <CropPreset {size} {selectedSize} {rotateHorizontal} {selectType} />
      {/each}
    </ul>
  {/each}
  <div class="flex h-10 w-full items-center justify-between text-sm">
    <h2 class="uppercase">{$t('editor_crop_tool_h2_rotation')}</h2>
  </div>
  <ul class="flex-wrap flex-row flex gap-x-6 gap-y-4 justify-center">
    <li>
      <IconButton
        shape="round"
        variant="ghost"
        color="secondary"
        aria-label={$t('anti_clockwise')}
        onclick={() => rotate(false)}
        icon={mdiRotateLeft}
      />
    </li>
    <li>
      <IconButton
        shape="round"
        variant="ghost"
        color="secondary"
        aria-label={$t('clockwise')}
        onclick={() => rotate(true)}
        icon={mdiRotateRight}
      />
    </li>
  </ul>
</div>
