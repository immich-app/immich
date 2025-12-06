<script lang="ts">
  import { transformManager } from '$lib/managers/edit/transform-manager.svelte';
  import { Button, Field, HStack, IconButton, Select, type SelectItem } from '@immich/ui';
  import { mdiCursorMove, mdiFlipHorizontal, mdiFlipVertical, mdiLock, mdiRotateLeft, mdiRotateRight } from '@mdi/js';
  import { t } from 'svelte-i18n';

  let cropOrientation = $state<'landscape' | 'portrait'>(
    transformManager.cropImageSize[0] >= transformManager.cropImageSize[1] ? 'landscape' : 'portrait',
  );
  let cropMode = $state<'free' | 'fixed'>('free');
  let selectedRatio = $state<SelectItem | undefined>();

  const horizontalRatios = ['4:3', '3:2', '7:5', '16:9'];
  const verticalRatios = ['3:4', '2:3', '5:7', '9:16'];

  let aspectRatios: SelectItem[] = $derived([
    { label: $t('crop_aspect_ratio_original'), value: 'original' },
    { label: '1:1', value: '1:1' },
    ...(cropOrientation === 'landscape' ? horizontalRatios : verticalRatios).map((ratio) => ({
      label: ratio,
      value: ratio,
    })),
  ]);

  // function resetCrop() {
  //   transformManager.resetCrop();
  //   selectedRatio = undefined;
  // }

  function selectAspectRatio(ratio: 'original' | 'free' | (typeof aspectRatios)[number]['value']) {
    if (ratio === 'original') {
      const [width, height] = transformManager.cropImageSize;
      ratio = `${width}:${height}`;
    }

    transformManager.setAspectRatio(ratio);
  }

  function onAspectRatioSelect(ratio: SelectItem) {
    selectedRatio = ratio;
    selectAspectRatio(ratio.value);
  }

  function setFreeCrop() {
    cropMode = 'free';
    selectAspectRatio('free');
  }

  function setFixedCrop() {
    cropMode = 'fixed';
    if (!selectedRatio) {
      selectedRatio = aspectRatios[0];
    }
    selectAspectRatio(selectedRatio.value);
  }

  function rotateCropOrientation() {
    const newOrientation = cropOrientation === 'landscape' ? 'portrait' : 'landscape';
    cropOrientation = newOrientation;

    // convert the selected ratio to the new orientation
    if (selectedRatio && selectedRatio.value !== 'free' && selectedRatio.value !== 'original') {
      const [width, height] = selectedRatio.value.split(':');
      const newRatio = `${height}:${width}`;
      selectedRatio = aspectRatios.find((ratio) => ratio.value === newRatio);
      selectAspectRatio(newRatio);
    }
  }

  async function rotateImage(degrees: number) {
    await transformManager.rotate(degrees);
    rotateCropOrientation();
  }
</script>

<div class="mt-3 px-4">
  <div class="flex h-10 w-full items-center justify-between text-sm">
    <h2 class="uppercase">{$t('crop')}</h2>
  </div>
  <HStack gap={0} class="mb-4">
    <Button
      leadingIcon={mdiCursorMove}
      shape="rectangle"
      class="rounded-l-md"
      onclick={setFreeCrop}
      color={cropMode === 'free' ? 'primary' : 'secondary'}
      fullWidth
    >
      {$t('crop_aspect_ratio_free')}
    </Button>
    <Button
      leadingIcon={mdiLock}
      shape="rectangle"
      class="rounded-r-md"
      color={cropMode === 'fixed' ? 'primary' : 'secondary'}
      onclick={setFixedCrop}
      fullWidth
    >
      {$t('crop_aspect_ratio_fixed')}
    </Button>
  </HStack>
  <HStack>
    <Field disabled={cropMode === 'free'}>
      <Select class="w-full" onChange={onAspectRatioSelect} bind:value={selectedRatio} data={aspectRatios} />
    </Field>
    <IconButton
      shape="round"
      variant="ghost"
      color="secondary"
      icon={mdiRotateRight}
      aria-label={$t('reset')}
      onclick={rotateCropOrientation}
      disabled={cropMode === 'free'}
    />
  </HStack>
  <div class="flex h-10 w-full items-center justify-between text-sm mt-2">
    <h2 class="uppercase">{$t('editor_crop_tool_h2_rotation')}</h2>
  </div>
  <HStack>
    <Button fullWidth leadingIcon={mdiRotateLeft} onclick={() => rotateImage(-90)}>{$t('rotate_ccw')}</Button>
    <Button fullWidth trailingIcon={mdiRotateRight} onclick={() => rotateImage(90)}>{$t('rotate_cw')}</Button>
  </HStack>
  <div class="flex h-10 w-full items-center justify-between text-sm mt-2">
    <h2 class="uppercase">{$t('editor_crop_tool_h2_mirror')}</h2>
  </div>
  <HStack>
    <Button fullWidth leadingIcon={mdiFlipHorizontal} onclick={() => rotateImage(-90)}>{$t('mirror_horizontal')}</Button
    >
    <Button fullWidth trailingIcon={mdiFlipVertical} onclick={() => rotateImage(90)}>{$t('mirror_vertical')}</Button>
  </HStack>
</div>
