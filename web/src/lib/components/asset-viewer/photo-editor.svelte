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
  import TriangleSmallUp from 'svelte-material-icons/TriangleSmallUp.svelte';

  import SuggestionsButton from './photo-editor/SuggestionsButton.svelte';
  import AspectRatioButton from './photo-editor/aspect-ratio-button.svelte';
  import AdjustElement from './photo-editor/adjust-element.svelte';
  import FilterCard from './photo-editor/filter-card.svelte';

  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let editorElement: HTMLDivElement;
  let imageElement: HTMLImageElement;
  let imageWrapper: HTMLDivElement;
  let cropElement: HTMLDivElement;

  let angle = 0;
  let angleSlider: HTMLElement;
  let angleSliderHandle: HTMLElement;

  let activeButton: 'autofix' | 'crop' | 'adjust' | 'filter' = 'crop';
  type activeEdit = 'optimized' | 'dynamic' | 'warm' | 'cold' | '';
  let activeEdit: activeEdit;

  let aspectRatioNum = 4 / 3;

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
    imageElement.src = assetData;
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
        await setAspectRatio('free');
        initAngleSlider();
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

  //function for dragging the angle selection slider
  const initAngleSlider = async () => {
    console.log('initAngleSlider');
    let pos1 = 0,
      pos2 = 0;

    //imageWrapper.style.marginTop = -(imageWrapper.offsetHeight - cropElement.offsetHeight) / 2 + 'px';
    //imageWrapper.style.marginLeft = -(imageWrapper.offsetWidth - cropElement.offsetWidth) / 2 + 'px';

    cropElement.style.aspectRatio = '' + aspectRatioNum;
    if (aspectRatioNum > 1) {
      cropElement.style.width = '100%';
      cropElement.style.height = 'auto';
      cropElement.style.maxHeight = '100%';
    } else {
      cropElement.style.width = 'auto';
      cropElement.style.height = '100%';
      cropElement.style.maxWidth = '100%';
    }

    const closeDragElement = () => {
      // stop moving when mouse button is released:
      document.onmouseup = null;
      document.onmousemove = null;
    };

    // // Set crop element aspect ratio

    // if (aspectRatioNum > 1) {
    //   imageWrapper.style.width = '100%';
    //   imageWrapper.style.height = 'auto';
    //   imageWrapper.style.maxHeight = '100%';
    // } else {
    //   imageWrapper.style.width = 'auto';
    //   imageWrapper.style.height = '100%';
    //   imageWrapper.style.maxWidth = '100%';
    // }

    // imageWrapper.style.aspectRatio = '' + aspectRatioNum;

    const elementDrag = async (e: MouseEvent) => {
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos2 - e.clientX;
      pos2 = e.clientX;
      // set the element's new position:
      let a = angleSlider.offsetLeft - pos1;
      if (a < 0) {
        a = Math.max(a, (-125 / 49) * 45);
      } else {
        a = Math.min(a, (125 / 49) * 45);
      }
      angle = Math.round((a / 125) * 49);
      angle = angle * -1;

      imageWrapper.style.transform = `rotate(${angle}deg)`;

      // const imageWrapperWidth = imageWrapper.offsetWidth;

      // //TODO: Maybe use relative units instead of px
      // const imageWrapperHeight = imageWrapper.offsetHeight - 112;

      // Get image wrapper width and height
      const imageWrapperWidth = imageWrapper.offsetWidth;
      const imageWrapperHeight = imageWrapper.offsetHeight;

      // Get crop element width and height
      const cropElementWidth = cropElement.offsetWidth;
      const cropElementHeight = cropElement.offsetHeight;

      console.log('cropElementWidth', cropElementWidth);
      console.log('cropElementHeight', cropElementHeight);
      console.log('angle', angle);
      console.log(Math.cos((Math.abs(angle) * Math.PI) / 180));

      const x1 = Math.cos((Math.abs(angle) * Math.PI) / 180) * cropElementWidth;
      const x2 = Math.cos(((90 - Math.abs(angle)) * Math.PI) / 180) * cropElementHeight;

      const y1 = Math.cos((Math.abs(angle) * Math.PI) / 180) * cropElementHeight;
      const y2 = Math.cos(((90 - Math.abs(angle)) * Math.PI) / 180) * cropElementWidth;

      if ((x1 + x2) / (y1 + y2) > imageWrapperWidth / imageWrapperHeight) {
        imageWrapper.style.width = `${x1 + x2}px`;
        imageWrapper.style.height = `${(x1 + x2) / (imageWrapperWidth / imageWrapperHeight)}px`;
      } else {
        imageWrapper.style.height = `${y1 + y2}px`;
        imageWrapper.style.width = `${(y1 + y2) / (imageWrapperHeight / imageWrapperWidth)}px`;
      }

      //imageWrapper.style.width = `${x1 + x2}px`;
      //imageWrapper.style.height = `${y1 + y2}px`;

      let b = a + 'px';
      angleSliderHandle.style.left = b;
      angleSlider.style.left = b;
    };

    const dragMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos2 = e.clientX;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
    };
    angleSliderHandle.onmousedown = dragMouseDown;
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
    //TODO: Revert all crop and rotate changes to the image by looking at the original image or revert history
    await imageEditor.stopDrawingMode();
    await imageEditor.setAngle(0);
    angleSliderHandle.style.left = '0';
    angleSlider.style.left = '0';
    angle = 0;
    imageElement.style.transform = `rotate(${angle}deg)`;

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

  const applyCrop = async () => {
    await imageEditor.crop(await imageEditor.getCropzoneRect());
    await setAspectRatio('free');
  };

  // Temporary function
  const save = async () => {
    const data = await imageEditor.toDataURL();
    const blob = await fetch(data).then((res) => res.blob());
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'test.png';
    a.click();
  };
</script>

<link rel="stylesheet" href="https://uicdn.toast.com/tui-image-editor/latest/tui-image-editor.css" />

<div
  class="fixed left-0 top-0 z-[1001] grid h-screen w-screen grid-cols-[1fr_1fr_1fr_360px] grid-rows-[64px_1fr] overflow-y-hidden bg-black"
>
  <div class="z-[1000] col-span-3 col-start-1 row-span-1 row-start-1 flex items-center transition-transform">
    <button
      on:click={() => dispatch('close')}
      class="hover:bg-immich-gray/10 ml-4 rounded-full p-3 text-2xl text-white"
    >
      <Close />
    </button>
    <button
      on:click={() => save()}
      class=" bg-immich-dark-primary hover:bg-immich-dark-primary/80 ml-auto mr-5 rounded-md p-[6px] px-4 text-black"
    >
      Save
    </button>
    <button class="hover:bg-immich-gray/10 mr-4 rounded-full p-3 text-2xl text-white">
      <DotsVertical />
    </button>
  </div>
  <div class="relative col-span-3 col-start-1 row-span-full row-start-1">
    <div class="flex h-full w-full justify-center">
      <div class="flex hidden h-full w-full items-center justify-center" bind:this={editorElement} />
      <div class="flex h-full w-full items-center justify-center {activeButton == 'crop' ? 'p-24 pb-52' : ''}">
        <div class="relative flex h-full w-full items-center justify-center">
          <div>
            <div bind:this={imageWrapper} class="">
              <img class="h-full w-full" bind:this={imageElement} src="" alt="" />
            </div>
            <div
              bind:this={cropElement}
              class="absolute left-1/2 top-1/2 mx-auto h-full w-full -translate-x-1/2 -translate-y-1/2 border-2 border-red-600"
            />
          </div>
        </div>
      </div>
    </div>
    {#if activeButton === 'crop'}
      <div class="h-26 bg-immich-dark-bg absolute bottom-0 flex w-full justify-center gap-0 px-4 py-2">
        <div class="grid h-full w-full max-w-[750px] grid-cols-[1fr,1fr,500px,2fr] grid-rows-1 items-center">
          <!-- Crop Options -->
          <div class="z-10 flex h-full w-full flex-col justify-center bg-black">
            <button
              on:click={() => flipHorizontal()}
              class="hover:bg-immich-gray/10 rounded-full p-3 text-2xl text-white"
            >
              <FlipHorizontal />
            </button>

            <button
              on:click={() => flipVertical()}
              class="hover:bg-immich-gray/10 rounded-full p-3 text-2xl text-white"
            >
              <FlipVertical />
            </button>
          </div>
          <div class="z-10 flex h-full w-full items-center justify-center bg-black">
            <button on:click={() => rotate(90)} class="hover:bg-immich-gray/10 rounded-full p-3 text-2xl text-white">
              <FormatRotate90 />
            </button>
          </div>

          <div class="relative z-0 h-[50px] w-[500px]">
            <!-- Angle selector slider -->
            <div
              bind:this={angleSlider}
              class="angle-slider absolute grid h-full w-full grid-cols-[repeat(13,1fr)] grid-rows-2 justify-around text-center text-xs"
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
            <div bind:this={angleSliderHandle} class="angle-slider absolute z-20 h-full w-full" />
            <div class="angle-slider-selection absolute left-[calc(50%-56px)] w-28 text-lg text-white">
              <div class="-mt-1.5 flex justify-center">
                {angle}°
              </div>
              <div class="mt-1.5 flex justify-center">
                <TriangleSmallUp />
              </div>
            </div>
          </div>

          <div class="z-10 flex h-full w-full items-center justify-center bg-black">
            <button
              class=" text-md text-immich-dark-primary hover:bg-immich-dark-primary/10 focus:bg-immich-dark-primary/20 rounded border border-white px-3 py-1.5 focus:outline-none"
              on:click={() => resetCropAndRotate()}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
  <div
    class="bg-immich-dark-gray z-[1000] col-span-1 col-start-4 row-span-1 row-start-1 flex justify-evenly pb-[16px] transition-transform"
  >
    <button
      title="Suggestions"
      on:click={() => navigateEditTab('autofix')}
      class="text-immich-gray/70 hover:text-immich-gray hover:bg-immich-gray/5 active:text-immich-dark-primary relative flex w-1/4 items-center justify-center"
      class:active={activeButton === 'autofix'}
    >
      <AutoFix size="1.5em" />
      <div
        class="bg-immich-dark-primary absolute bottom-0 hidden h-[3px] w-6 rounded-t-full"
        class:active={activeButton == 'autofix'}
      />
    </button>
    <button
      title="Crop & Rotate"
      on:click={() => navigateEditTab('crop')}
      class="text-immich-gray/70 hover:text-immich-gray hover:bg-immich-gray/5 active:text-immich-dark-primary relative flex w-1/4 items-center justify-center"
      class:active={activeButton === 'crop'}
    >
      <CropRotate size="1.5em" />
      <div
        class="bg-immich-dark-primary absolute bottom-0 hidden h-[3px] w-6 rounded-t-full"
        class:active={activeButton == 'crop'}
      />
    </button><button
      title="Adjust"
      on:click={() => navigateEditTab('adjust')}
      class="text-immich-gray/70 hover:text-immich-gray hover:bg-immich-gray/5 active:text-immich-dark-primary relative flex w-1/4 items-center justify-center"
      class:active={activeButton === 'adjust'}
    >
      <Tune size="1.5em" />
      <div
        class="bg-immich-dark-primary absolute bottom-0 hidden h-[3px] w-6 rounded-t-full"
        class:active={activeButton == 'adjust'}
      />
    </button><button
      title="Filter"
      on:click={() => navigateEditTab('filter')}
      class="text-immich-gray/70 hover:text-immich-gray hover:bg-immich-gray/5 active:text-immich-dark-primary relative flex w-1/4 items-center justify-center"
      class:active={activeButton === 'filter'}
    >
      <ImageAutoAdjust size="1.5em" />
      <div
        class="bg-immich-dark-primary absolute bottom-0 hidden h-[3px] w-6 rounded-t-full"
        class:active={activeButton == 'filter'}
      />
    </button>
  </div>
  <div class="bg-immich-dark-gray col-span-1 col-start-4 row-span-full row-start-2 overflow-auto">
    {#if activeButton === 'autofix'}
      <div class="grid gap-y-2 px-6 pt-2">
        <!-- Suggestions -->
        <div class="text-immich-gray/60 mb-4">Suggestions</div>
        <SuggestionsButton
          buttonName="Enhanced"
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
      <div class="grid gap-y-2 px-6 pt-2">
        <!-- Crop & Rotate -->
        <div class="text-immich-gray/60 mb-4">Aspect Ratio</div>
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
        <button
          on:click={() => applyCrop()}
          class="bg-immich-dark-primary hover:bg-immich-dark-primary/80 ml-0 mr-auto mt-5 rounded-md p-[6px] px-4 text-black"
        >
          Apply
        </button>
      </div>
    {:else if activeButton === 'adjust'}
      <div class="grid gap-y-2 px-6 pt-2">
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
      <div class="grid justify-center px-6 pt-2">
        <!-- Filter -->
        <div class="grid grid-cols-3 gap-x-3">
          <FilterCard title="Without" />
          <FilterCard title="Vivid" />
        </div>
        <hr class="border-1 border-immich-gray/10 mx-4 my-7" />
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
        <hr class="border-1 border-immich-gray/10 mx-4 my-7" />
        <div class="grid grid-cols-3 gap-x-3">
          <FilterCard title="West" />
          <FilterCard title="Metro" />
          <FilterCard title="Reel" />
          <FilterCard title="Bazaar" />
          <FilterCard title="Ollie" />
        </div>
        <hr class="border-1 border-immich-gray/10 mx-4 my-7" />
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
