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
  let assetDragHandle: HTMLDivElement;

  let currentAngle = 0;
  let currentAngleOffset = 0;
  let currentAspectRatio: string | aspectRatio = 'original';
  let currentFlipY = false;
  let currentFlipX = false;

  let currentTranslateDirection: 'x' | 'y' | '' = '';
  let currentTranslate = { x: 0, y: 0 };

  let angleSlider: HTMLElement;
  let angleSliderHandle: HTMLElement;

  let activeButton: 'autofix' | 'crop' | 'adjust' | 'filter' = 'crop';
  type activeEdit = 'optimized' | 'dynamic' | 'warm' | 'cold' | '';
  let activeEdit: activeEdit;

  let aspectRatioNum = 9 / 16;

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
        await setAspectRatio('original', false);
        initAngleSlider();
        initAssetDrag();
        break;
      case 'adjust':
        break;
      case 'filter':
      default:
        break;
    }
  };

  const setAspectRatio = async (aspectRatio: string | aspectRatio, isRotate?: boolean) => {
    const originalAspect = imageElement.naturalWidth / imageElement.naturalHeight;

    if (isRotate) {
      if (!['free', 'square', 'original'].includes(aspectRatio)) {
        const strings = aspectRatio.split('_');
        aspectRatio = strings[1] + '_' + strings[0];
      }
      if (currentAngleOffset % 180 !== 0) {
        isRotate = false;
      }
    }
    currentAspectRatio = aspectRatio;

    switch (aspectRatio) {
      case 'free':
        // free ratio selection
        aspectRatioNum = 0;
        break;
      case 'square':
        aspectRatioNum = 1;
        break;
      case 'original':
        aspectRatioNum = originalAspect;
        if (isRotate) {
          aspectRatioNum = 1 / originalAspect;
        }
        break;
      case '16_9':
        aspectRatioNum = 16 / 9;
        break;
      case '9_16':
        aspectRatioNum = 9 / 16;
        break;
      case '5_4':
        aspectRatioNum = 5 / 4;
        break;
      case '4_5':
        aspectRatioNum = 4 / 5;
        break;
      case '4_3':
        aspectRatioNum = 4 / 3;
        break;
      case '3_4':
        aspectRatioNum = 3 / 4;
        break;
      case '3_2':
        aspectRatioNum = 3 / 2;
        break;
      case '2_3':
        aspectRatioNum = 2 / 3;
        break;
      default:
        aspectRatioNum = originalAspect;
        break;
    }

    cropElement.style.aspectRatio = '' + aspectRatioNum;
    if (aspectRatioNum > 1) {
      cropElement.style.width = '100%';
      cropElement.style.height = 'auto';
      //cropElement.style.maxHeight = '100%';
    } else {
      cropElement.style.width = 'auto';
      cropElement.style.height = '100%';
      //cropElement.style.maxWidth = '100%';
    }

    currentTranslate = { x: 0, y: 0 };
    calcImageElement(currentAngle);
    setImageWrapperTransform();
  };

  //function for dragging the angle selection slider
  const initAngleSlider = async () => {
    console.log('initAngleSlider');
    let pos1 = 0,
      pos2 = 0;

    const closeDragElement = () => {
      // stop moving when mouse button is released:
      angleSliderHandle.onmouseup = null;
      angleSliderHandle.onmousemove = null;
      angleSliderHandle.ontouchend = null;
      angleSliderHandle.ontouchmove = null;
    };

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

      console.log('a', a);

      let angle = Math.round((a / 125) * 49);
      angle = angle * -1;

      rotate(angle, currentAngleOffset);
    };

    const elementDragTouch = async (e: TouchEvent) => {
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos2 - e.touches[0].clientX;
      pos2 = e.touches[0].clientX;
      // set the element's new position:
      let a = angleSlider.offsetLeft - pos1;

      console.log('a', a);
      if (a < 0) {
        a = Math.max(a, (-125 / 49) * 45);
      } else {
        a = Math.min(a, (125 / 49) * 45);
      }

      console.log('a', a);

      let angle = Math.round((a / 125) * 49);
      angle = angle * -1;

      rotate(angle, currentAngleOffset);
    };

    const dragMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos2 = e.clientX;
      angleSliderHandle.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      angleSliderHandle.onmousemove = elementDrag;
    };

    const dragTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      console.log('dragTouchStart');
      // get the mouse cursor position at startup:
      pos2 = e.touches[0].clientX;
      angleSliderHandle.ontouchend = closeDragElement;
      // call a function whenever the cursor moves:
      angleSliderHandle.ontouchmove = elementDragTouch;
    };
    angleSliderHandle.onmousedown = dragMouseDown;
    angleSliderHandle.ontouchstart = dragTouchStart;
  };

  const initAssetDrag = async () => {
    console.log('initAssetDrag');
    let pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0;
    const closeDragElement = () => {
      // stop moving when mouse button is released:
      assetDragHandle.onmouseup = null;
      assetDragHandle.onmousemove = null;
    };

    const elementDrag = async (e: MouseEvent) => {
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;

      let x = 0;
      let y = 0;

      //Calc max y translation
      const h1 = cropElement.offsetHeight;
      const w1 = cropElement.offsetWidth;
      const h2 = w1 * Math.tan((Math.abs(currentAngle) * Math.PI) / 180);
      const d = Math.cos((Math.abs(currentAngle) * Math.PI) / 180) * (h1 + h2);
      const maxY = (imageWrapper.offsetHeight - d) / 2;

      // Calc max x translation
      const h3 = Math.sin((Math.abs(currentAngle) * Math.PI) / 180) * h1;
      const h4 = Math.cos((Math.abs(currentAngle) * Math.PI) / 180) * w1;
      const maxX = (imageWrapper.offsetWidth - h3 - h4) / 2;

      if (currentTranslate.x - pos1 > maxX) {
        x = maxX;
      } else if (currentTranslate.x - pos1 < -maxX) {
        x = -maxX;
      } else {
        x = currentTranslate.x - pos1;
      }

      if (currentTranslate.y - pos2 > maxY) {
        y = maxY;
      } else if (currentTranslate.y - pos2 < -maxY) {
        y = -maxY;
      } else {
        y = currentTranslate.y - pos2;
      }

      // Decide which direction to translate
      if (currentTranslateDirection === 'y') {
        currentTranslate = {
          x: 0,
          y: y,
        };
      } else if (currentTranslateDirection === 'x') {
        currentTranslate = {
          x: x,
          y: 0,
        };
      } else {
        currentTranslate = {
          x: 0,
          y: 0,
        };
      }

      console.log('currentTranslate', currentTranslate);
      setImageWrapperTransform();
    };

    const dragMouseDown = (e: MouseEvent) => {
      console.log('dragMouseDown');

      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      assetDragHandle.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      assetDragHandle.onmousemove = elementDrag;
    };
    assetDragHandle.onmousedown = dragMouseDown;
  };

  const calcImageElement = (angle: number) => {
    // Get image wrapper width and height
    const imageWrapperWidth = imageWrapper.offsetWidth;
    const imageWrapperHeight = imageWrapper.offsetHeight;
    const originalAspect = imageElement.naturalWidth / imageElement.naturalHeight;

    // Get crop element width and height
    const cropElementWidth = cropElement.offsetWidth;
    const cropElementHeight = cropElement.offsetHeight;

    const x1 = Math.cos((Math.abs(angle) * Math.PI) / 180) * cropElementWidth;
    const x2 = Math.cos(((90 - Math.abs(angle)) * Math.PI) / 180) * cropElementHeight;

    const y1 = Math.cos((Math.abs(angle) * Math.PI) / 180) * cropElementHeight;
    const y2 = Math.cos(((90 - Math.abs(angle)) * Math.PI) / 180) * cropElementWidth;

    if (currentAngleOffset === 90 || currentAngleOffset === 270) {
      if ((x1 + x2) / (y1 + y2) > 1 / originalAspect) {
        imageWrapper.style.height = `${x1 + x2}px`;
        imageWrapper.style.width = `${(x1 + x2) / (1 / originalAspect)}px`;
        console.log('Translation in Y possible');
        console.log('case1');
        currentTranslateDirection = 'y';
      } else if ((x1 + x2) / (y1 + y2) < 1 / originalAspect) {
        imageWrapper.style.height = `${y1 + y2}px`;
        imageWrapper.style.width = `${(y1 + y2) / (1 / originalAspect)}px`;
        currentTranslateDirection = 'x';
        console.log('Translation in X possible');
        console.log('case2');
      } else {
        imageWrapper.style.width = `${y1 + y2}px`;
        imageWrapper.style.height = `${(y1 + y2) / originalAspect}px`;
        currentTranslateDirection = '';
        console.log('case3');
      }
    } else {
      if ((x1 + x2) / (y1 + y2) > originalAspect) {
        imageWrapper.style.width = `${x1 + x2}px`;
        imageWrapper.style.height = `${(x1 + x2) / originalAspect}px`;
        console.log('Translation in Y possible');
        console.log('case4');
        currentTranslateDirection = 'y';
      } else if ((x1 + x2) / (y1 + y2) < originalAspect) {
        imageWrapper.style.height = `${y1 + y2}px`;
        imageWrapper.style.width = `${(y1 + y2) / (1 / originalAspect)}px`;
        console.log('Translation in X possible');
        currentTranslateDirection = 'x';
        console.log('case5');
      } else {
        imageWrapper.style.height = `${y1 + y2}px`;
        imageWrapper.style.width = `${(y1 + y2) / (1 / originalAspect)}px`;
        currentTranslateDirection = '';
        console.log('case6');
      }
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
    currentFlipX = false;
    currentFlipY = false;
    rotate(0, 0);
    await setAspectRatio('original');
  };

  const flipVertical = async () => {
    currentFlipY = !currentFlipY;
    console.log('flipVertical');
    rotate(currentAngle, currentAngleOffset);
  };
  const flipHorizontal = async () => {
    currentFlipX = !currentFlipX;
    console.log('flipHorizontal');
    rotate(currentAngle, currentAngleOffset);
  };

  const rotate = async (angle: number, angleOffset: number, isRotate?: boolean) => {
    if (angleOffset > 360) {
      angleOffset = angleOffset - 360;
    }

    setAspectRatio(currentAspectRatio, isRotate ? true : false);

    let a = -1 * angle * (125 / 49);
    let b = a + 'px';
    angleSliderHandle.style.left = b;
    angleSlider.style.left = b;

    currentAngle = angle;
    currentAngleOffset = angleOffset;
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

  const setImageWrapperTransform = () => {
    let transformString = '';
    transformString += `rotate(${currentAngle - currentAngleOffset}deg)`;
    if (currentFlipX) {
      transformString += ' scaleX(-1)';
    }
    if (currentFlipY) {
      transformString += ' scaleY(-1)';
    }
    if (currentTranslate.x || currentTranslate.y) {
      transformString += ` translate(${currentTranslate.x}px, ${currentTranslate.y}px)`;
    }

    imageWrapper.style.transform = transformString;
  };
</script>

<div
  class="fixed left-0 top-0 z-[1001] grid h-screen w-screen grid-cols-[1fr_1fr_1fr_360px] grid-rows-[64px_1fr] overflow-hidden bg-black"
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
    <!-- TODO: fix only allow drag from crop Element or imageWrapper -->
    <div class="flex h-full w-full justify-center" bind:this={assetDragHandle}>
      <div class="flex hidden h-full w-full items-center justify-center" bind:this={editorElement} />
      <div class="-z-10 flex h-full w-full items-center justify-center {activeButton == 'crop' ? 'p-24 pb-52' : ''}">
        <div class="relative flex h-full w-full items-center justify-center">
          <div>
            <div bind:this={imageWrapper} class="">
              <img class="h-full w-full" bind:this={imageElement} src="" alt="" />
            </div>
            <div
              bind:this={cropElement}
              class="absolute left-1/2 top-1/2 z-[1000] z-[1000] mx-auto -translate-x-1/2 -translate-y-1/2 bg-transparent shadow-[0_0_500px_500px_rgba(0,0,0,0.8)]"
            >
              <div class="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-white" />
              <div class="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-white" />
              <div class="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-white" />
              <div class="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-white" />
            </div>
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
            <button
              on:click={() => rotate(currentAngle, currentAngleOffset + 90, true)}
              class="hover:bg-immich-gray/10 rounded-full p-3 text-2xl text-white"
            >
              <FormatRotate90 />
            </button>
          </div>

          <div class="relative z-0 h-[50px] w-[500px]">
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
            <div bind:this={angleSliderHandle} class="angle-slider absolute z-20 h-full w-full cursor-pointer" />
            <div class="angle-slider-selection absolute left-[calc(50%-56px)] w-28 text-lg text-white">
              <div class="-mt-1.5 flex justify-center">
                {currentAngle}°
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
  <!-- <div class="absolute h-full w-full" /> -->
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
          <AspectRatioButton
            on:click={() => setAspectRatio('free')}
            isActive={currentAspectRatio === 'free'}
            title="Free"
          >
            <Fullscreen />
          </AspectRatioButton>
          <AspectRatioButton
            on:click={() => setAspectRatio('original')}
            isActive={currentAspectRatio === 'original'}
            title="Original"
          >
            <RelativeScale />
          </AspectRatioButton>
          <AspectRatioButton
            on:click={() => setAspectRatio('16_9')}
            isActive={currentAspectRatio === '16_9'}
            title="16:9"
          >
            <RectangleOutline />
          </AspectRatioButton>
          <AspectRatioButton
            on:click={() => setAspectRatio('9_16')}
            isActive={currentAspectRatio === '9_16'}
            title="9:16"
          >
            <RectangleOutline />
          </AspectRatioButton>
          <AspectRatioButton on:click={() => setAspectRatio('5_4')} isActive={currentAspectRatio === '5_4'} title="5:4">
            <RectangleOutline />
          </AspectRatioButton>
          <AspectRatioButton on:click={() => setAspectRatio('4_5')} isActive={currentAspectRatio === '4_5'} title="4:5">
            <RectangleOutline />
          </AspectRatioButton>
          <AspectRatioButton on:click={() => setAspectRatio('4_3')} isActive={currentAspectRatio === '4_3'} title="4:3">
            <RectangleOutline />
          </AspectRatioButton>
          <AspectRatioButton on:click={() => setAspectRatio('3_4')} isActive={currentAspectRatio === '3_4'} title="3:4">
            <RectangleOutline />
          </AspectRatioButton>
          <AspectRatioButton on:click={() => setAspectRatio('3_2')} isActive={currentAspectRatio === '3_2'} title="3:2">
            <RectangleOutline />
          </AspectRatioButton>
          <AspectRatioButton on:click={() => setAspectRatio('2_3')} isActive={currentAspectRatio === '2_3'} title="2:3">
            <RectangleOutline />
          </AspectRatioButton>
          <AspectRatioButton
            on:click={() => setAspectRatio('square')}
            isActive={currentAspectRatio === 'square'}
            title="Square"
          >
            <SquareOutline />
          </AspectRatioButton>
        </div>
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
