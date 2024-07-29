<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import {
    cropAspectRatio,
    cropImageScale,
    cropImageSize,
    cropSettings,
    type CropAspectRatio,
  } from '$lib/stores/asset-editor.store';
  import { mdiBackupRestore, mdiCropFree, mdiSquareOutline } from '@mdi/js';
  import { get } from 'svelte/store';

  let sizes = [
    {
      icon: mdiCropFree,
      name: 'free',
      viewBox: '0 0 24 24',
    },
    {
      name: '1:1',
      icon: mdiSquareOutline,
      viewBox: '0 0 24 24',
    },
    {
      name: '16:9',
      icon: `M200-280q-33 0-56.5-23.5T120-360v-240q0-33 23.5-56.5T200-680h560q33 0 56.5 23.5T840-600v240q0 33-23.5 56.5T760-280H200Zm0-80h560v-240H200v240Zm0 0v-240 240Z`,
      viewBox: '50 -700 840 400',
    },
    {
      name: '3:2',
      icon: `M200-240q-33 0-56.5-23.5T120-320v-320q0-33 23.5-56.5T200-720h560q33 0 56.5 23.5T840-640v320q0 33-23.5 56.5T760-240H200Zm0-80h560v-320H200v320Zm0 0v-320 320Z`,
      viewBox: '50 -720 840 480',
    },
    {
      name: '7:5',
      icon: `M200-200q-33 0-56.5-23.5T120-280v-400q0-33 23.5-56.5T200-760h560q33 0 56.5 23.5T840-680v400q0 33-23.5 56.5T760-200H200Zm0-80h560v-400H200v400Zm0 0v-400 400Z`,
      viewBox: '50 -760 840 560',
    },
    {
      name: 'reset',
      icon: mdiBackupRestore,
      viewBox: '0 0 24 24',
    },
  ];

  let selectedSize: CropAspectRatio = 'free';

  function selectType(size: CropAspectRatio) {
    if (size == 'reset') {
      selectedSize = 'free';
      let cropImageSizeM = get(cropImageSize);
      let cropImageScaleM = get(cropImageScale);
      cropSettings.set({
        x: 0,
        y: 0,
        width: cropImageSizeM[0] * cropImageScaleM - 1,
        height: cropImageSizeM[1] * cropImageScaleM - 1,
      });
      cropAspectRatio.set(selectedSize);
      return;
    }
    selectedSize = size;
    cropAspectRatio.set(size);
  }
</script>

<div class="mt-3">
  <ul class="flex-wrap flex-row flex gap-x-6 gap-y-4 justify-evenly">
    {#each sizes as size (size.name)}
      <li>
        <Button
          color={selectedSize == size.name ? 'primary' : 'transparent-gray'}
          class="flex-col gap-1"
          size="sm"
          rounded="lg"
          on:click={() => selectType(size.name)}
        >
          <Icon size="1.75em" path={size.icon} viewBox={size.viewBox} />
          <span>{size.name}</span>
        </Button>
      </li>
    {/each}
  </ul>
</div>

<style>
  li {
    width: auto;
  }
</style>
