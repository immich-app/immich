<script lang="ts">
  import { transformManager } from '$lib/managers/edit/transform-manager.svelte';
  import { Button, Field, HStack, IconButton, Select, type SelectItem } from '@immich/ui';
  import { mdiFlipHorizontal, mdiFlipVertical, mdiRotateLeft, mdiRotateRight } from '@mdi/js';
  import { t } from 'svelte-i18n';

  const aspectRatios: SelectItem[] = [
    { label: $t('crop_aspect_ratio_free'), value: 'free' },
    { label: $t('crop_aspect_ratio_original'), value: 'original' },
    {
      label: '9:16',
      value: '9:16',
    },
    {
      label: '5:7',
      value: '5:7',
    },
    {
      label: '4:5',
      value: '4:5',
    },
    {
      label: '3:4',
      value: '3:4',
    },
    {
      label: '2:3',
      value: '2:3',
    },
    {
      label: 'Square',
      value: '1:1',
    },
  ];

  let selectedRatioItem = $state<SelectItem>(aspectRatios[0]);

  let selectedRatio = $derived(selectedRatioItem.value);

  function selectAspectRatio(ratio: 'original' | 'free' | (typeof aspectRatios)[number]['value']) {
    if (ratio === 'original') {
      const [width, height] = transformManager.cropImageSize;
      ratio = `${width}:${height}`;
    }

    transformManager.setAspectRatio(ratio);
  }

  function onAspectRatioSelect(ratio: SelectItem) {
    selectedRatio = ratio.value;
    selectAspectRatio(ratio.value);
  }

  function rotateAspectRatio() {
    transformManager.rotateAspectRatio();
  }

  async function rotateImage(degrees: number) {
    await transformManager.rotate(degrees);
  }

  function mirrorImage(axis: 'horizontal' | 'vertical') {
    transformManager.mirror(axis);
  }
</script>

<div class="mt-3 px-4">
  <div class="flex h-10 w-full items-center justify-between text-sm">
    <h2>{$t('crop')}</h2>
  </div>
  <HStack>
    <Field>
      <Select class="w-full" onChange={onAspectRatioSelect} bind:value={selectedRatioItem} data={aspectRatios} />
    </Field>
    <IconButton
      shape="round"
      variant="ghost"
      color="secondary"
      icon={mdiRotateRight}
      aria-label={$t('reset')}
      onclick={rotateAspectRatio}
      disabled={selectedRatio === 'free' || selectedRatio === 'original'}
    />
  </HStack>
  <div class="flex h-10 w-full items-center justify-between text-sm mt-2">
    <h2>{$t('editor_orientation')}</h2>
  </div>
  <HStack>
    <Button fullWidth leadingIcon={mdiRotateLeft} onclick={() => rotateImage(-90)}></Button>
    <Button fullWidth trailingIcon={mdiRotateRight} onclick={() => rotateImage(90)}></Button>
    <Button fullWidth leadingIcon={mdiFlipHorizontal} onclick={() => mirrorImage('horizontal')}></Button>
    <Button fullWidth trailingIcon={mdiFlipVertical} onclick={() => mirrorImage('vertical')}></Button>
  </HStack>
</div>
