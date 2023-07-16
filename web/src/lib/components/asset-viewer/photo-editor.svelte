<script lang="ts">
  import ImageEditor from 'tui-image-editor?client';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { api, AssetResponseDto } from '@api';
  import { handleError } from '$lib/utils/handle-error';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';
  import Button from '../elements/buttons/button.svelte';
  import AutoFix from 'svelte-material-icons/AutoFix.svelte';
  import ImageFilterHdr from 'svelte-material-icons/ImageFilterHdr.svelte';
  import WeatherSunny from 'svelte-material-icons/WeatherSunny.svelte';
  import WeatherCloudy from 'svelte-material-icons/WeatherCloudy.svelte';
  import CropRotate from 'svelte-material-icons/CropRotate.svelte';
  import Tune from 'svelte-material-icons/Tune.svelte';
  import ImageAutoAdjust from 'svelte-material-icons/ImageAutoAdjust.svelte';
  import Fullscreen from 'svelte-material-icons/Fullscreen.svelte';
  import RelativeScale from 'svelte-material-icons/RelativeScale.svelte';
  import RectangleOutline from 'svelte-material-icons/RectangleOutline.svelte';
  import SquareOutline from 'svelte-material-icons/SquareOutline.svelte';
  import Brightness6 from 'svelte-material-icons/Brightness6.svelte';
  import Close from 'svelte-material-icons/Close.svelte';
  import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
  import FlipHorizontal from 'svelte-material-icons/FlipHorizontal.svelte';
  import FlipVertical from 'svelte-material-icons/FlipVertical.svelte';
  import FormatRotate90 from 'svelte-material-icons/FormatRotate90.svelte';

  import SuggestionsButton from './photo-editor/SuggestionsButton.svelte';
  import AspectRatioButton from './photo-editor/aspect-ratio-button.svelte';
  import AdjustElement from './photo-editor/adjust-element.svelte';
  import FilterCard from './photo-editor/filter-card.svelte';

  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let editorElement: HTMLDivElement;

  let activeButton: 'autofix' | 'crop' | 'adjust' | 'filter' = 'autofix';
  type activeEdit = 'optimized' | 'dynamic' | 'warm' | 'cold' | '';
  let activeEdit: activeEdit;

  type aspectRatio =
    | 'free'
    | 'square'
    | 'original'
    | '16_9'
    | '9_16'
    | '5_4'
    | '4_5'
    | '4_3'
    | '3_4'
    | '3_2'
    | '2_3'
    | 'square';
  let aspectRatio: aspectRatio = 'free';

  export let asset: AssetResponseDto;
  let assetData: string;
  let publicSharedKey = '';
  let imageEditor: ImageEditor;

  onMount(async () => {
    let maxWidth: string = String(window.innerWidth);
    let maxHeight: string = String(window.innerHeight);
    console.log(maxWidth, maxHeight);
    imageEditor = new ImageEditor(editorElement, {});
    console.log(imageEditor.getCanvasSize() as any);
    try {
      await loadAssetData();
    } catch (error) {
      // Throw error
      handleError(error, 'Failed to load asset data');
    }
    const result = await imageEditor.loadImageFromURL(assetData, 'test');
    console.log(result);
  });

  const loadAssetData = async () => {
    try {
      const { data } = await api.assetApi.serveFile(
        { id: asset.id, isThumb: false, isWeb: true, key: publicSharedKey },
        {
          responseType: 'blob',
        },
      );

      if (!(data instanceof Blob)) {
        return;
      }

      assetData = URL.createObjectURL(data);
      return assetData;
    } catch {
      // Do nothing
      console.log('Failed to load asset data');
    }
  };

  const navigateEditTab = async (button: 'autofix' | 'crop' | 'adjust' | 'filter') => {
    activeButton = button;
    switch (activeButton) {
      case 'autofix':
        break;
      case 'crop':
        setAspectRatio('free');
        break;
      case 'adjust':
        break;
      case 'filter':
      default:
        break;
    }
  };

  const setAspectRatio = async (ratio: aspectRatio) => {
    aspectRatio = ratio;
    // Switch for all aspect ratios
    await imageEditor.startDrawingMode('CROPPER');
    switch (aspectRatio) {
      case 'free':
        imageEditor.setCropzoneRect();
        break;
      case 'square':
        imageEditor.setCropzoneRect(1 / 1);
        break;
      case 'original':
        // const canvasSize = imageEditor.getCanvasSize();
        // imageEditor.setCropzoneRect(canvasSize.width / canvasSize.height);
        imageEditor.setCropzoneRect();
        break;
      case '16_9':
        imageEditor.setCropzoneRect(16 / 9);
        break;
      case '9_16':
        imageEditor.setCropzoneRect(9 / 16);
        break;
      case '5_4':
        imageEditor.setCropzoneRect(5 / 4);
        break;
      case '4_5':
        imageEditor.setCropzoneRect(4 / 5);
        break;
      case '4_3':
        imageEditor.setCropzoneRect(4 / 3);
        break;
      case '3_4':
        imageEditor.setCropzoneRect(3 / 4);
        break;
      case '3_2':
        imageEditor.setCropzoneRect(3 / 2);
        break;
      case '2_3':
        imageEditor.setCropzoneRect(2 / 3);
        break;
      default:
        imageEditor.setCropzoneRect();
        break;
    }
  };

  const navigateEdit = (edit: activeEdit) => {
    console.log('navigateEdit');
    let revert = false;
    if (activeEdit === edit) {
      revert = true;
    }
    activeEdit = edit;
    if (revert) {
      activeEdit = '';
    }
    switch (activeEdit) {
      case 'optimized':
        break;
      case 'dynamic':
        break;
      case 'warm':
        break;
      case 'cold':
        break;
      default:
        break;
    }
  };

  const resetCropAndRotate = async () => {
    await imageEditor.stopDrawingMode();
    await imageEditor.setAngle(0);
    await imageEditor.resetFlip().catch(() => {});
    await setAspectRatio('free');
  };

  const flipVertical = async () => {
    await imageEditor.stopDrawingMode();
    await imageEditor.flipY();
    await setAspectRatio(aspectRatio);
  };
  const flipHorizontal = async () => {
    await imageEditor.stopDrawingMode();
    await imageEditor.flipX();
    await setAspectRatio(aspectRatio);
  };
  const rotate = async (angle: number) => {
    await imageEditor.stopDrawingMode();
    await imageEditor.rotate(angle);
    await setAspectRatio(aspectRatio);
  };
</script>

<link rel="stylesheet" href="https://uicdn.toast.com/tui-image-editor/latest/tui-image-editor.css" />

<div
  class="fixed h-screen w-screen left-0 top-0 overflow-y-hidden bg-black z-[1001] grid grid-rows-[64px_1fr] grid-cols-[1fr_1fr_1fr_360px]"
>
  <div class="col-start-1 col-span-3 row-start-1 row-span-1 z-[1000] transition-transform flex items-center">
    <button
      on:click={() => dispatch('close')}
      class="rounded-full text-2xl text-white hover:bg-immich-gray/10 p-3 ml-4"
    >
      <Close />
    </button>
    <button
      class=" ml-auto rounded-md bg-immich-dark-primary p-[6px] px-4 mr-5 text-black hover:bg-immich-dark-primary/80"
    >
      Save
    </button>
    <button class="rounded-full text-2xl text-white hover:bg-immich-gray/10 p-3 mr-4">
      <DotsVertical />
    </button>
  </div>
  <div class="relative row-start-1 row-span-full col-start-1 col-span-3">
    <div class="h-full w-full flex justify-center">
      <div class="h-full w-full flex justify-center items-center" bind:this={editorElement} />
    </div>
    {#if activeButton === 'crop'}
      <div class="absolute bottom-0 h-26 bg-immich-dark-bg w-full px-4 py-2 flex items-center">
        <!-- Crop Options -->
        <div class="flex flex-col w-fit ml-6">
          <button
            on:click={() => flipHorizontal()}
            class="rounded-full text-2xl text-white hover:bg-immich-gray/10 p-3"
          >
            <FlipHorizontal />
          </button>
          <button on:click={() => flipVertical()} class="rounded-full text-2xl text-white hover:bg-immich-gray/10 p-3">
            <FlipVertical />
          </button>
        </div>
        <button on:click={() => rotate(90)} class="rounded-full text-2xl text-white hover:bg-immich-gray/10 p-3">
          <FormatRotate90 />
        </button>

        <button
          class="ml-auto mr-20 rounded text-md text-immich-dark-primary border border-white hover:bg-immich-dark-primary/10 px-3 py-1.5 focus:bg-immich-dark-primary/20 focus:outline-none"
          on:click={() => resetCropAndRotate()}
        >
          Reset
        </button>
      </div>
    {/if}
  </div>
  <div
    class="col-start-4 col-span-1 row-start-1 row-span-1 z-[1000] transition-transform bg-immich-dark-gray pb-[16px] flex justify-evenly"
  >
    <button
      title="Suggestions"
      on:click={() => navigateEditTab('autofix')}
      class="relative flex justify-center items-center w-1/4 text-immich-gray/70 hover:text-immich-gray hover:bg-immich-gray/5 active:text-immich-dark-primary"
      class:active={activeButton === 'autofix'}
    >
      <AutoFix size="1.5em" />
      <div
        class="absolute bottom-0 rounded-t-full h-[3px] bg-immich-dark-primary w-6 hidden"
        class:active={activeButton == 'autofix'}
      />
    </button>
    <button
      title="Crop & Rotate"
      on:click={() => navigateEditTab('crop')}
      class="relative flex justify-center items-center w-1/4 text-immich-gray/70 hover:text-immich-gray hover:bg-immich-gray/5 active:text-immich-dark-primary"
      class:active={activeButton === 'crop'}
    >
      <CropRotate size="1.5em" />
      <div
        class="absolute bottom-0 rounded-t-full h-[3px] bg-immich-dark-primary w-6 hidden"
        class:active={activeButton == 'crop'}
      />
    </button><button
      title="Adjust"
      on:click={() => navigateEditTab('adjust')}
      class="relative flex justify-center items-center w-1/4 text-immich-gray/70 hover:text-immich-gray hover:bg-immich-gray/5 active:text-immich-dark-primary"
      class:active={activeButton === 'adjust'}
    >
      <Tune size="1.5em" />
      <div
        class="absolute bottom-0 rounded-t-full h-[3px] bg-immich-dark-primary w-6 hidden"
        class:active={activeButton == 'adjust'}
      />
    </button><button
      title="Filter"
      on:click={() => navigateEditTab('filter')}
      class="relative flex justify-center items-center w-1/4 text-immich-gray/70 hover:text-immich-gray hover:bg-immich-gray/5 active:text-immich-dark-primary"
      class:active={activeButton === 'filter'}
    >
      <ImageAutoAdjust size="1.5em" />
      <div
        class="absolute bottom-0 rounded-t-full h-[3px] bg-immich-dark-primary w-6 hidden"
        class:active={activeButton == 'filter'}
      />
    </button>
  </div>
  <div class="row-start-2 row-span-full col-start-4 col-span-1 bg-immich-dark-gray overflow-auto">
    {#if activeButton === 'autofix'}
      <div class="px-6 pt-2 gap-y-2 grid">
        <!-- Suggestions -->
        <div class="mb-4 text-immich-gray/60">Suggestions</div>
        <SuggestionsButton
          buttonName="Optimized"
          isActive={activeEdit === 'optimized'}
          on:click={() => navigateEdit('optimized')}
        >
          <AutoFix />
        </SuggestionsButton>
        <SuggestionsButton
          buttonName="Dynamic"
          isActive={activeEdit === 'dynamic'}
          on:click={() => navigateEdit('dynamic')}
        >
          <ImageFilterHdr />
        </SuggestionsButton>
        <SuggestionsButton buttonName="Warm" isActive={activeEdit === 'warm'} on:click={() => navigateEdit('warm')}>
          <WeatherSunny />
        </SuggestionsButton>
        <SuggestionsButton buttonName="Cold" isActive={activeEdit === 'cold'} on:click={() => navigateEdit('cold')}>
          <WeatherCloudy />
        </SuggestionsButton>
      </div>
    {:else if activeButton === 'crop'}
      <div class="px-6 pt-2 gap-y-2 grid">
        <!-- Crop & Rotate -->
        <div class="mb-4 text-immich-gray/60">Aspect Ratio</div>
        <div class="grid grid-cols-2 gap-y-4">
          <AspectRatioButton on:click={() => setAspectRatio('free')} isActive={aspectRatio === 'free'} title="Free">
            <Fullscreen />
          </AspectRatioButton>
          <AspectRatioButton
            on:click={() => setAspectRatio('original')}
            isActive={aspectRatio === 'original'}
            title="Original"
          >
            <RelativeScale />
          </AspectRatioButton>
          <AspectRatioButton on:click={() => setAspectRatio('16_9')} isActive={aspectRatio === '16_9'} title="16:9">
            <RectangleOutline />
          </AspectRatioButton>
          <AspectRatioButton on:click={() => setAspectRatio('9_16')} isActive={aspectRatio === '9_16'} title="9:16">
            <RectangleOutline />
          </AspectRatioButton>
          <AspectRatioButton on:click={() => setAspectRatio('5_4')} isActive={aspectRatio === '5_4'} title="5:4">
            <RectangleOutline />
          </AspectRatioButton>
          <AspectRatioButton on:click={() => setAspectRatio('4_5')} isActive={aspectRatio === '4_5'} title="4:5">
            <RectangleOutline />
          </AspectRatioButton>
          <AspectRatioButton on:click={() => setAspectRatio('4_3')} isActive={aspectRatio === '4_3'} title="4:3">
            <RectangleOutline />
          </AspectRatioButton>
          <AspectRatioButton on:click={() => setAspectRatio('3_4')} isActive={aspectRatio === '3_4'} title="3:4">
            <RectangleOutline />
          </AspectRatioButton>
          <AspectRatioButton on:click={() => setAspectRatio('3_2')} isActive={aspectRatio === '3_2'} title="3:2">
            <RectangleOutline />
          </AspectRatioButton>
          <AspectRatioButton on:click={() => setAspectRatio('2_3')} isActive={aspectRatio === '2_3'} title="2:3">
            <RectangleOutline />
          </AspectRatioButton>
          <AspectRatioButton
            on:click={() => setAspectRatio('square')}
            isActive={aspectRatio === 'square'}
            title="Square"
          >
            <SquareOutline />
          </AspectRatioButton>
        </div>
      </div>
    {:else if activeButton === 'adjust'}
      <div class="px-6 pt-2 gap-y-2 grid">
        <!-- Adjust -->
        <div class="grid gap-y-8">
          <AdjustElement title="HDR">
            <ImageFilterHdr />
          </AdjustElement>
          <AdjustElement title="Brightness">
            <Brightness6 />
          </AdjustElement>
        </div>
      </div>
    {:else if activeButton === 'filter'}
      <div class="px-6 pt-2 grid justify-center">
        <!-- Filter -->
        <div class="grid grid-cols-3 gap-x-3">
          <FilterCard title="Without" />
          <FilterCard title="Vivid" />
        </div>
        <hr class="my-7 mx-4 border-1 border-immich-gray/10" />
        <div class="grid grid-cols-3 gap-x-3">
          <FilterCard title="Playa" />
          <FilterCard title="Honey" />
          <FilterCard title="Isla" />
          <FilterCard title="Desert" />
          <FilterCard title="Clay" />
          <FilterCard title="Palma" />
          <FilterCard title="Blush" />
          <FilterCard title="Alpaca" />
          <FilterCard title="Modena" />
        </div>
        <hr class="my-7 mx-4 border-1 border-immich-gray/10" />
        <div class="grid grid-cols-3 gap-x-3">
          <FilterCard title="West" />
          <FilterCard title="Metro" />
          <FilterCard title="Reel" />
          <FilterCard title="Bazaar" />
          <FilterCard title="Ollie" />
        </div>
        <hr class="my-7 mx-4 border-1 border-immich-gray/10" />
        <div class="grid grid-cols-3 gap-x-3">
          <FilterCard title="Onyx" />
          <FilterCard title="Eiffel" />
          <FilterCard title="Vogue" />
          <FilterCard title="Vista" />
        </div>
      </div>
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
</style>
