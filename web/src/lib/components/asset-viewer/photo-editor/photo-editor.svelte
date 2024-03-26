<script lang="ts">
  import { mdiContrastCircle, mdiRedo, mdiUndo } from '@mdi/js'; // Contrast, undo, redo
  import { mdiBrightness6 } from '@mdi/js'; // Brightness
  import { mdiInvertColors } from '@mdi/js'; // Invert
  import { mdiBlur } from '@mdi/js'; // Blur
  import { mdiCircleHalfFull } from '@mdi/js'; // Vignette
  import { mdiDotsCircle } from '@mdi/js'; // Tilt-shift
  import { mdiSelectInverse } from '@mdi/js'; // Selective
  import { mdiPillar } from '@mdi/js'; // Pillarbox

  import { mdiAutoFix } from '@mdi/js'; // Auto
  import { mdiImageFilterHdr } from '@mdi/js'; // HDR
  import { mdiWeatherSunny } from '@mdi/js'; // Exposure
  import { mdiWeatherCloudy } from '@mdi/js'; // Contrast
  import { mdiCropRotate } from '@mdi/js'; // Rotate
  import { mdiTune } from '@mdi/js'; // Adjust
  import { mdiImageAutoAdjust } from '@mdi/js'; // Auto Adjust
  import { mdiFullscreen } from '@mdi/js'; // Fullscreen
  import { mdiRelativeScale } from '@mdi/js'; // Ratio
  import { mdiRectangleOutline } from '@mdi/js'; // Rectangle
  import { mdiSquareOutline } from '@mdi/js'; // Square

  import { mdiClose } from '@mdi/js'; // Close
  import { mdiDotsVertical } from '@mdi/js'; // More
  import { mdiFlipHorizontal } from '@mdi/js'; // Flip horizontal
  import { mdiFlipVertical } from '@mdi/js'; // Flip vertical
  import { mdiFormatRotate90 } from '@mdi/js'; // Rotate
  import { mdiTriangleSmallUp } from '@mdi/js'; // Triangle

  import { onMount } from 'svelte';

  import Icon from '$lib/components/elements/icon.svelte';

  import { pinch, pan } from 'svelte-hammer';

  import SuggestionsButton from './suggestions-button.svelte';
  import AspectRatioButton from './aspect-ratio-button.svelte';
  import AdjustElement from './adjust-element.svelte';
  import FilterCard from './filter-card.svelte';

  import { createEventDispatcher } from 'svelte';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import ContextMenu from '$lib/components/shared-components/context-menu/context-menu.svelte';
  import { getContextMenuPosition } from '$lib/utils/context-menu';
  import { clickOutside } from '$lib/utils/click-outside';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { Editor } from './editor';
  import { presets } from './presets';
  import type { mode as modeType } from './types';
  import type { AssetResponseDto } from '@immich/sdk';

  const dispatch = createEventDispatcher();

  export let asset: AssetResponseDto;

  let editor: Editor;

  let isLoaded = false;

  let imageWrapper: HTMLDivElement;
  let cropElement: HTMLDivElement;

  let angleSlider: HTMLElement;
  let angleSliderHandle: HTMLElement;

  type activeEdit = 'optimized' | 'dynamic' | 'warm' | 'cold' | '';
  let activeEdit: activeEdit;

  let isRendering = false;
  let isUploading = false;

  let mode: modeType;
  let angle = 0;
  let presetName = 'without';
  let canUndo = false;
  let canRedo = false;
  let filter = {
    brightness: 1,
    contrast: 1,
    saturation: 1,
    blur: 0,
    grayscale: 0,
    hueRotate: 1,
    invert: 0,
    sepia: 0,
  };

  let contextMenuPosition = { x: 0, y: 0 };
  let isShowEditOptions = false;
  const showOptionsMenu = (event: MouseEvent) => {
    contextMenuPosition = getContextMenuPosition(event, 'top-right');
    isShowEditOptions = !isShowEditOptions;
  };

  const imagePanHandler = (event: CustomEvent) => {
    if (mode !== 'crop') {
      return;
    }
    editor.pan(event.detail.deltaX, event.detail.deltaY);
  };

  const imagePinchHandler = (event: CustomEvent) => {
    if (mode !== 'crop') {
      return;
    }
    editor.zoom(event.detail.scale);
  };

  const anglePanHandler = (event: CustomEvent) => {
    if (mode !== 'crop') {
      return;
    }
    const x: number = event.detail.deltaX;
    let a = angleSlider.offsetLeft - x;

    a = a < 0 ? Math.max(a, (-125 / 49) * 45) : Math.min(a, (125 / 49) * 45);

    console.log('a', a);

    angle += Math.round((a / 125) * 49);
    if (angle > 45) {
      angle = 45;
    } else if (angle < -45) {
      angle = -45;
    }
    editor.rotate(angle);
  };

  const navigateEdit = (edit: activeEdit) => {
    activeEdit = edit;
  };

  $: b = -1 * angle * (125 / 49);
  $: angleSliderHandle ? (angleSliderHandle.style.left = b + 'px') : null;
  $: angleSlider ? (angleSlider.style.left = b + 'px') : null;

  onMount(async () => {
    editor = new Editor(asset, imageWrapper, cropElement, null, () => {
      angle = editor.getAngle();
      presetName = editor.getPreset();
      canUndo = editor.canUndo();
      canRedo = editor.canRedo();
      filter = editor.getFilter();
      mode = editor.getMode();
    });
    isLoaded = false;
    await editor.loadData();
    isLoaded = true;
    editor.setMode('crop');
  });

  let isZooming = false;
  const imageZoomHandler = (event: WheelEvent) => {
    editor.zoom(event.deltaY > 0 ? 1 : -1, true);
    if (!isZooming) {
      setTimeout(() => {
        editor.save();
        isZooming = false;
      }, 1000);
    }
    isZooming = true;
  };
</script>

<div
  class="fixed left-0 top-0 z-[1003] grid h-screen w-screen grid-cols-[1fr_1fr_1fr_360px] grid-rows-[64px_1fr] overflow-hidden bg-black"
>
  <div class="z-[1000] col-span-3 col-start-1 row-span-1 row-start-1 flex items-center transition-transform">
    <button
      on:click={() => dispatch('close')}
      class="hover:bg-immich-gray/10 ml-4 rounded-full p-3 text-2xl text-white"
    >
      <Icon path={mdiClose} />
    </button>

    {#if isLoaded}
      <!-- goBackInHistory Button -->
      <button
        on:click={() => editor.undo()}
        disabled={!canUndo}
        class="hover:bg-immich-gray/10 ml-4 rounded-full p-3 text-2xl text-white ml-auto disabled:text-gray-500 disabled:bg-transparent disabled:cursor-not-allowed"
      >
        <Icon path={mdiUndo} />
      </button>

      <!-- goForwardInHistory -->
      <button
        on:click={() => editor.redo()}
        disabled={!canRedo}
        class="hover:bg-immich-gray/10 ml-4 rounded-full p-3 text-2xl text-white disabled:text-gray-500 disabled:bg-transparent disabled:cursor-not-allowed"
      >
        <Icon path={mdiRedo} />
      </button>

      <button
        on:click={async () => {
          isRendering = true;
          const blob = await editor.render();
          isRendering = false;
          isUploading = true;
          try {
            await editor.upload(blob);
            isUploading = false;
          } catch (error) {
            console.log(error);
            isUploading = false;
          }
        }}
        disabled={isRendering || isUploading}
        class=" {isRendering || isUploading
          ? 'bg-immich-dark-primary/50 hover:cursor-wait'
          : 'bg-immich-dark-primary hover:bg-immich-dark-primary/80 '}  ml-4 mr-5 inline-flex items-center rounded-md p-[6px] px-4 text-black"
      >
        <svg
          class="-ml-1 mr-3 h-5 w-5 animate-spin text-black {isRendering || isUploading ? '' : 'hidden'}"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {isRendering && !isUploading ? 'Rendering' : isUploading ? 'Uploading' : 'Save'}
      </button>
      <div use:clickOutside on:outclick={() => (isShowEditOptions = false)}>
        <CircleIconButton isOpacity={true} icon={mdiDotsVertical} on:click={showOptionsMenu} title="More" />
        {#if isShowEditOptions}
          <ContextMenu {...contextMenuPosition} direction="left">
            <MenuOption on:click={() => editor.clear()} text="Clear History" />
            <MenuOption on:click={() => editor.reset()} text="Reset" />
            <MenuOption
              on:click={async () => {
                isRendering = true;
                const blob = await editor.render();
                editor.download(blob, asset.originalFileName);
                isRendering = false;
              }}
              text="Download"
            />
          </ContextMenu>
        {/if}
      </div>
    {/if}
  </div>
  <div class="relative col-span-3 col-start-1 row-span-full row-start-1">
    <div
      class="flex h-full w-full justify-center"
      use:pinch={{ enable: true }}
      use:pan
      on:pan={(e) => imagePanHandler(e)}
      on:panend={() => editor.save()}
      on:pinch={imagePinchHandler}
      on:pinchend={() => editor.save()}
      on:wheel={imageZoomHandler}
    >
      <div class="-z-10 flex h-full w-full items-center justify-center">
        <div class="relative h-full w-full pb-36 p-8 flex justify-center items-center">
          <div
            bind:this={cropElement}
            id="cropElement"
            class="relative flex justify-center items-center z-[1004] mx-auto bg-transparent {mode === 'crop'
              ? 'shadow-[0_0_5000px_5000px_rgba(0,0,0,0.8)]'
              : 'shadow-[0_0_5000px_5000px_#000000]'}"
          >
            {#if !isLoaded}
              <span class="flex justify-between items-center gap-2 text-white text-l">
                Loading
                <LoadingSpinner />
              </span>
            {/if}

            <div bind:this={imageWrapper} class="absolute"></div>
            <div
              class="h-full w-full absolute {mode === 'crop'
                ? 'shadow-[0_0_5000px_5000px_rgba(0,0,0,0.8)]'
                : 'shadow-[0_0_5000px_5000px_#000000]'}"
            ></div>
            {#if mode === 'crop'}
              <div class="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-white" />
              <div class="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-white" />
              <div class="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-white" />
              <div class="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-white" />
            {/if}
          </div>
        </div>
      </div>
    </div>
    <div
      class="{mode === 'crop'
        ? ''
        : 'hidden'} h-26 bg-immich-dark-bg absolute bottom-0 flex w-full justify-center gap-0 px-4 py-2"
    >
      <div class="grid h-full w-full max-w-[750px] grid-cols-[1fr,1fr,500px,2fr] grid-rows-1 items-center">
        <!-- Crop Options -->
        <div class="z-10 flex h-full w-full flex-col justify-center bg-black">
          <button
            on:click={() => editor.flip(false, true)}
            class="hover:bg-immich-gray/10 rounded-full p-3 text-2xl text-white"
          >
            <Icon path={mdiFlipHorizontal} />
          </button>

          <button
            on:click={() => editor.flip(true, false)}
            class="hover:bg-immich-gray/10 rounded-full p-3 text-2xl text-white"
          >
            <Icon path={mdiFlipVertical} />
          </button>
        </div>
        <div class="z-10 flex h-full w-full items-center justify-center bg-black">
          <button
            on:click={() => editor.rotate90()}
            class="hover:bg-immich-gray/10 rounded-full p-3 text-2xl text-white"
          >
            <Icon path={mdiFormatRotate90} />
          </button>
        </div>

        <div
          class="relative z-3000 h-[50px] w-[500px]"
          use:pan
          on:pan={anglePanHandler}
          on:panend={() => editor.save()}
        >
          <!-- Angle selector slider -->
          <div
            bind:this={angleSlider}
            class="angle-slider absolute grid h-full w-full select-none grid-cols-[repeat(13,1fr)] grid-rows-2 justify-around text-center text-xs"
          >
            <div>-90°</div>
            <div>-75°</div>
            <div>-60°</div>
            <div>-45°</div>
            <div>-30°</div>
            <div>-15°</div>
            <div>0°</div>
            <div>15°</div>
            <div>30°</div>
            <div>45°</div>
            <div>60°</div>
            <div>75°</div>
            <div>90°</div>
            <div class="col-start-1 col-end-[14] row-start-2 grid grid-cols-[repeat(39,1fr)]">
              <div />
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div>.</div>
              <div />
            </div>
          </div>
          <div class="angle-slider-shadow absolute h-full w-full" />
          <div class="angle-slider-selection absolute left-[calc(50%-56px)] w-28 text-lg text-white">
            <span class="-mt-1.5 flex justify-center">{angle}°</span>
            <div class="mt-1.5 flex justify-center">
              <Icon path={mdiTriangleSmallUp} size="1.5em" />
            </div>
          </div>
        </div>

        <div class="z-10 flex h-full w-full items-center justify-center bg-black">
          <button
            class=" text-md text-immich-dark-primary hover:bg-immich-dark-primary/10 focus:bg-immich-dark-primary/20 rounded border border-white px-3 py-1.5 focus:outline-none"
            on:click={() => editor.reset()}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  </div>
  <!-- <div class="absolute h-full w-full" /> -->
  <div
    class="bg-immich-dark-gray z-[1000] col-span-1 col-start-4 row-span-1 row-start-1 flex justify-evenly pb-[16px] transition-transform"
  >
    <button
      title="Suggestions"
      on:click={() => editor.setMode('autofix')}
      class="text-immich-gray/70 hover:text-immich-gray hover:bg-immich-gray/5 active:text-immich-dark-primary relative flex w-1/4 items-center justify-center"
      class:active={mode === 'autofix'}
    >
      <Icon path={mdiAutoFix} size="1.5em" />
      <div
        class="bg-immich-dark-primary absolute bottom-0 hidden h-[3px] w-6 rounded-t-full"
        class:active={mode == 'autofix'}
      />
    </button>
    <button
      title="Crop & Rotate"
      on:click={() => editor.setMode('crop')}
      class="text-immich-gray/70 hover:text-immich-gray hover:bg-immich-gray/5 active:text-immich-dark-primary relative flex w-1/4 items-center justify-center"
      class:active={mode === 'crop'}
    >
      <Icon path={mdiCropRotate} size="1.5em" />
      <div
        class="bg-immich-dark-primary absolute bottom-0 hidden h-[3px] w-6 rounded-t-full"
        class:active={mode == 'crop'}
      />
    </button><button
      title="Adjust"
      on:click={() => editor.setMode('adjust')}
      class="text-immich-gray/70 hover:text-immich-gray hover:bg-immich-gray/5 active:text-immich-dark-primary relative flex w-1/4 items-center justify-center"
      class:active={mode === 'adjust'}
    >
      <Icon path={mdiTune} size="1.5em" />
      <div
        class="bg-immich-dark-primary absolute bottom-0 hidden h-[3px] w-6 rounded-t-full"
        class:active={mode == 'adjust'}
      />
    </button><button
      title="Filter"
      on:click={() => editor.setMode('filter')}
      class="text-immich-gray/70 hover:text-immich-gray hover:bg-immich-gray/5 active:text-immich-dark-primary relative flex w-1/4 items-center justify-center"
      class:active={mode === 'filter'}
    >
      <Icon path={mdiImageAutoAdjust} size="1.5em" />
      <div
        class="bg-immich-dark-primary absolute bottom-0 hidden h-[3px] w-6 rounded-t-full"
        class:active={mode == 'filter'}
      />
    </button>
  </div>
  <div class="bg-immich-dark-gray col-span-1 col-start-4 row-span-full row-start-2 overflow-auto">
    {#if isLoaded}
      {#if mode === 'autofix'}
        <div class="grid gap-y-2 px-6 pt-2">
          <!-- Suggestions -->
          <div class="text-immich-gray/60 mb-4">Suggestions</div>
          <SuggestionsButton
            buttonName="Enhanced"
            isActive={activeEdit === 'optimized'}
            on:click={() => navigateEdit('optimized')}
          >
            <Icon path={mdiAutoFix} size="1.5em" />
          </SuggestionsButton>
          <SuggestionsButton
            buttonName="Dynamic"
            isActive={activeEdit === 'dynamic'}
            on:click={() => navigateEdit('dynamic')}
          >
            <Icon path={mdiImageFilterHdr} size="1.5em" />
          </SuggestionsButton>
          <SuggestionsButton buttonName="Warm" isActive={activeEdit === 'warm'} on:click={() => navigateEdit('warm')}>
            <Icon path={mdiWeatherSunny} size="1.5em" />
          </SuggestionsButton>
          <SuggestionsButton buttonName="Cold" isActive={activeEdit === 'cold'} on:click={() => navigateEdit('cold')}>
            <Icon path={mdiWeatherCloudy} size="1.5em" />
          </SuggestionsButton>
        </div>
      {:else if mode === 'crop'}
        <div class="grid gap-y-2 px-6 pt-2">
          <!-- Crop & Rotate -->
          <div class="text-immich-gray/60 mb-4">Aspect Ratio</div>
          <div class="grid grid-cols-2 gap-y-4">
            <AspectRatioButton
              on:click={() => editor.ratio('free')}
              isActive={editor.getRatioString() === 'free'}
              title="Free"
            >
              <Icon path={mdiFullscreen} size="1.5em" />
            </AspectRatioButton>
            <AspectRatioButton
              on:click={() => editor.ratio('original')}
              isActive={editor.getRatioString() === 'original'}
              title="Original"
            >
              <Icon path={mdiRelativeScale} size="1.5em" />
            </AspectRatioButton>
            <AspectRatioButton
              on:click={() => editor.ratio('16_9')}
              isActive={editor.getRatioString() === '16_9'}
              title="16:9"
            >
              <Icon path={mdiRectangleOutline} size="1.5em" />
            </AspectRatioButton>
            <AspectRatioButton
              on:click={() => editor.ratio('9_16')}
              isActive={editor.getRatioString() === '9_16'}
              title="9:16"
            >
              <Icon path={mdiRectangleOutline} size="1.5em" />
            </AspectRatioButton>
            <AspectRatioButton
              on:click={() => editor.ratio('5_4')}
              isActive={editor.getRatioString() === '5_4'}
              title="5:4"
            >
              <Icon path={mdiRectangleOutline} size="1.5em" />
            </AspectRatioButton>
            <AspectRatioButton
              on:click={() => editor.ratio('4_5')}
              isActive={editor.getRatioString() === '4_5'}
              title="4:5"
            >
              <Icon path={mdiRectangleOutline} size="1.5em" />
            </AspectRatioButton>
            <AspectRatioButton
              on:click={() => editor.ratio('4_3')}
              isActive={editor.getRatioString() === '4_3'}
              title="4:3"
            >
              <Icon path={mdiRectangleOutline} size="1.5em" />
            </AspectRatioButton>
            <AspectRatioButton
              on:click={() => editor.ratio('3_4')}
              isActive={editor.getRatioString() === '3_4'}
              title="3:4"
            >
              <Icon path={mdiRectangleOutline} size="1.5em" />
            </AspectRatioButton>
            <AspectRatioButton
              on:click={() => editor.ratio('3_2')}
              isActive={editor.getRatioString() === '3_2'}
              title="3:2"
            >
              <Icon path={mdiRectangleOutline} size="1.5em" />
            </AspectRatioButton>
            <AspectRatioButton
              on:click={() => editor.ratio('2_3')}
              isActive={editor.getRatioString() === '2_3'}
              title="2:3"
            >
              <Icon path={mdiRectangleOutline} size="1.5em" />
            </AspectRatioButton>
            <AspectRatioButton
              on:click={() => editor.ratio('square')}
              isActive={editor.getRatioString() === 'square'}
              title="Square"
            >
              <Icon path={mdiSquareOutline} size="1.5em" />
            </AspectRatioButton>
          </div>
        </div>
      {:else if mode === 'adjust'}
        <div class="grid gap-y-2 px-6 pt-2">
          <!-- Adjust -->
          <div class="grid gap-y-8">
            <AdjustElement
              title="Brightness"
              type={true}
              value={filter.brightness}
              on:update={(e) => editor.filter({ brightness: e.detail })}
              on:save={() => editor.save()}
            >
              <Icon path={mdiBrightness6} size="1.5em" />
            </AdjustElement>
            <AdjustElement
              title="Contrast"
              type={true}
              value={filter.contrast}
              on:update={(e) => editor.filter({ contrast: e.detail })}
              on:save={() => editor.save()}
            >
              <Icon path={mdiContrastCircle} size="1.5em" />
            </AdjustElement>
            <AdjustElement
              title="Saturation"
              type={true}
              value={filter.saturation}
              on:update={(e) => editor.filter({ saturation: e.detail })}
              on:save={() => editor.save()}
            >
              <Icon path={mdiInvertColors} size="1.5em" />
            </AdjustElement>
            <AdjustElement
              title="Blur"
              type={false}
              value={filter.blur}
              on:update={(e) => editor.filter({ blur: e.detail })}
              on:save={() => editor.save()}
            >
              <Icon path={mdiBlur} size="1.5em" />
            </AdjustElement>
            <AdjustElement
              title="Grayscale"
              type={false}
              value={filter.grayscale}
              on:update={(e) => editor.filter({ grayscale: e.detail })}
              on:save={() => editor.save()}
            >
              <Icon path={mdiCircleHalfFull} size="1.5em" />
            </AdjustElement>
            <AdjustElement
              title="Hue Rotate"
              type={true}
              value={filter.hueRotate}
              on:update={(e) => editor.filter({ hueRotate: e.detail })}
              on:save={() => editor.save()}
            >
              <Icon path={mdiDotsCircle} size="1.5em" />
            </AdjustElement>
            <AdjustElement
              title="Invert"
              type={false}
              value={filter.invert}
              on:update={(e) => editor.filter({ invert: e.detail })}
              on:save={() => editor.save()}
            >
              <Icon path={mdiSelectInverse} size="1.5em" />
            </AdjustElement>
            <AdjustElement
              title="Sepia"
              type={false}
              value={filter.sepia}
              on:update={(e) => editor.filter({ sepia: e.detail })}
              on:save={() => editor.save()}
            >
              <Icon path={mdiPillar} size="1.5em" />
            </AdjustElement>
          </div>
        </div>
      {:else if mode === 'filter'}
        <div class="grid justify-center px-6 pt-2">
          <!-- Filter -->
          <div class="grid grid-cols-3 gap-x-3">
            <FilterCard
              title="Custom"
              name={presetName}
              on:update={(e) => editor.preset(e.detail)}
              thumbData={editor.getThumbData()}
              on:save={() => editor.save()}
            />
            {#each Object.keys(presets) as preset (preset)}
              <FilterCard
                title={preset}
                name={presetName}
                on:update={(e) => editor.preset(e.detail)}
                thumbData={editor.getThumbData()}
                on:save={() => editor.save()}
              />
              <!-- {#if i == 2}
        </div>
          <hr class="border-1 border-immich-gray/10 mx-4 my-7" />
          <div class="grid grid-cols-3 gap-x-3">
            {/if} -->

              <!-- {#if i == 11}
          </div>
          <hr class="border-1 border-immich-gray/10 mx-4 my-7" />
          <div class="grid grid-cols-3 gap-x-3">
            {/if} -->

              <!-- {#if i == 16}
          </div>
          <hr class="border-1 border-immich-gray/10 mx-4 my-7" />
          <div class="grid grid-cols-3 gap-x-3">
            {/if} -->
            {/each}
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .active {
    color: #adcbfa;
    display: flex;
  }
  .active:focus {
    background-color: rgba(173, 203, 250, 0.15);
  }

  .angle-slider-shadow {
    background: rgb(0, 0, 0);
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 1) 0%,
      rgba(9, 9, 121, 0) 30%,
      rgba(5, 108, 186, 0) 70%,
      rgba(0, 0, 0, 1) 100%
    );
  }
  .angle-slider {
    left: 0px;
  }
  .angle-slider-selection {
    background: rgb(0, 0, 0);
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0) 0%,
      rgba(0, 0, 0, 1) 33%,
      rgba(0, 0, 0, 1) 66%,
      rgba(0, 0, 0, 0) 100%
    );
  }
</style>
