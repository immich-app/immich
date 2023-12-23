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

  import { onMount, SvelteComponent } from 'svelte';
  import { api, AssetResponseDto } from '@api';
  import { handleError } from '$lib/utils/handle-error';

  import Icon from '$lib/components/elements/icon.svelte';

  import { pinch, pan } from 'svelte-hammer';

  import SuggestionsButton from './suggestions-button.svelte';
  import AspectRatioButton from './aspect-ratio-button.svelte';
  import AdjustElement from './adjust-element.svelte';
  import FilterCard from './filter-card.svelte';

  import Render from './render.svelte';
  import { presets as presetsObject } from './filter.js';

  const presets = presetsObject as { [key: string]: Preset };

  const editHistory = [
    {
      angle: 0,
      angleOffset: 0,
      aspectRatio: 'original',
      crop: {
        width: 0,
        height: 0,
      },
      flipX: false,
      flipY: false,
      filter: {
        blur: 0,
        brightness: 1,
        contrast: 1,
        grayscale: 0,
        hueRotate: 1,
        invert: 0,
        opacity: 1,
        saturation: 1,
        sepia: 0,
      },
      filterName: 'without',
      translate: {
        x: 0,
        y: 0,
      },
      zoom: 1,
    },
  ];
  let editHistoryIndex = 0;

  const rotate90 = () => {
    rotateImage(currentAngle, currentAngleOffset + 90, true);
    updateEditHistory();
  };

  type Preset = {
    blur: number;
    brightness: number;
    contrast: number;
    grayscale: number;
    hueRotate: number;
    invert: number;
    opacity: number;
    saturation: number;
    sepia: number;
  };

  import { createEventDispatcher } from 'svelte';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import ContextMenu from '$lib/components/shared-components/context-menu/context-menu.svelte';
  import { getContextMenuPosition } from '$lib/utils/context-menu';
  import { clickOutside } from '$lib/utils/click-outside';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';

  const dispatch = createEventDispatcher();

  // Image adjustment
  let currentFilter: Preset = {
    blur: 0,
    brightness: 1,
    contrast: 1,
    grayscale: 0,
    hueRotate: 1,
    invert: 0,
    opacity: 1,
    saturation: 1,
    sepia: 0,
  };

  // Render

  let renderElement: SvelteComponent;
  let editorElement: HTMLDivElement;
  let imageElement: HTMLImageElement;

  let originalImage: HTMLImageElement;
  let isLoaded = false;

  let imageWrapper: HTMLDivElement;
  let cropElement: HTMLDivElement;
  let cropElementWrapper: HTMLDivElement;

  let currentAngle = 0;
  let currentAngleOffset = 0;
  let currentAspectRatio: string | aspectRatio = 'original';
  let currentCrop = { width: 0, height: 0 };
  let currentFlipY = false;
  let currentFlipX = false;

  let currentFilterName = 'without';

  let currentRatio = 0;

  let currentTranslateDirection: 'x' | 'y' | '' = '';
  let currentTranslate = { x: 0, y: 0 };
  let currentZoom = 1;

  const zoomSpeed = 0.02;

  let angleSlider: HTMLElement;
  let angleSliderHandle: HTMLElement;

  let activeButton: 'autofix' | 'crop' | 'adjust' | 'filter' = 'adjust';
  type activeEdit = 'optimized' | 'dynamic' | 'warm' | 'cold' | '';
  let activeEdit: activeEdit;

  let aspectRatioNum = 9 / 16;

  let isRendering = false;

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
  let assetBlob: Blob;
  let thumbData: string;
  let publicSharedKey = '';

  let contextMenuPosition = { x: 0, y: 0 };
  let isShowEditOptions = false;
  const showOptionsMenu = (event: MouseEvent) => {
    contextMenuPosition = getContextMenuPosition(event, 'top-right');
    isShowEditOptions = !isShowEditOptions;
  };

  $: currentCrop = cropElement
    ? {
        width: cropElement.offsetWidth,
        height: cropElement.offsetHeight,
      }
    : { width: 0, height: 0 };

  $: currentRatio = originalImage ? originalImage.naturalWidth / imageWrapper.offsetWidth : 0;

  const imagePanHandler = (event: CustomEvent) => {
    console.log('imagePanHandler');
    console.log(event.detail);

    let deltaX: number = event.detail.deltaX;
    let deltaY: number = event.detail.deltaY;

    // if (currentAngleOffset === 90) {
    //   const temp = pos1;
    //   pos1 = -pos2;
    //   pos2 = temp;
    // } else if (currentAngleOffset === 180) {
    //   pos1 = -pos1;
    //   pos2 = -pos2;
    // } else if (currentAngleOffset === 270) {
    //   const temp = pos1;
    //   pos1 = pos2;
    //   pos2 = -temp;
    // }

    currentTranslate.x = deltaX;
    currentTranslate.y = deltaY;

    let maxY = 0;
    let maxX = 0;

    //Calc max y translation
    let h1 = cropElement.offsetHeight;
    let w1 = cropElement.offsetWidth;

    if (currentAngleOffset === 90) {
      const temp = h1;
      const temp2 = currentTranslate.x;
      h1 = w1;
      w1 = temp;
      currentTranslate.x = -currentTranslate.y;
      currentTranslate.y = temp2;
    }

    if (currentAngleOffset === 270) {
      const temp = h1;
      const temp2 = currentTranslate.x;
      h1 = w1;
      w1 = temp;
      currentTranslate.x = -currentTranslate.y;
      currentTranslate.y = temp2;
    }

    if (currentAngleOffset === 180 || currentAngleOffset === 270) {
      currentTranslate.x = -currentTranslate.x;
      currentTranslate.y = -currentTranslate.y;
    }

    const h2 = w1 * Math.tan((Math.abs(currentAngle) * Math.PI) / 180);
    const d = Math.cos((Math.abs(currentAngle) * Math.PI) / 180) * (h1 + h2);

    maxY = (imageWrapper.offsetHeight * currentZoom - d) / 2;

    maxY = maxY / currentZoom;

    // Calc max x translation
    const h3 = Math.sin((Math.abs(currentAngle) * Math.PI) / 180) * h1;
    const h4 = Math.cos((Math.abs(currentAngle) * Math.PI) / 180) * w1;
    maxX = (imageWrapper.offsetWidth * currentZoom - h3 - h4) / 2;
    maxX = maxX / currentZoom;

    if (currentTranslate.x > maxX) {
      currentTranslate.x = maxX;
    } else if (currentTranslate.x < -maxX) {
      currentTranslate.x = -maxX;
    }

    if (currentTranslate.y > maxY) {
      currentTranslate.y = maxY;
    } else if (currentTranslate.y < -maxY) {
      currentTranslate.y = -maxY;
    }

    setImageWrapperTransform();
  };

  const imagePinchHandler = (event: CustomEvent) => {
    const scale = event.detail.scale;
    if (scale > 1) {
      if (currentZoom <= 5) {
        currentZoom += zoomSpeed * scale;
      }
    } else {
      if (currentZoom > 1) {
        currentZoom -= zoomSpeed / scale;
      }
    }
    setImageWrapperTransform();
  };

  const anglePanHandler = (event: CustomEvent) => {
    const x: number = event.detail.deltaX;
    let a = angleSlider.offsetLeft - x;

    if (a < 0) {
      a = Math.max(a, (-125 / 49) * 45);
    } else {
      a = Math.min(a, (125 / 49) * 45);
    }
    let angle = Math.round((a / 125) * 49);
    //angle = angle * -1;
    angle = currentAngle + angle;
    if (angle > 45) {
      angle = 45;
    } else if (angle < -45) {
      angle = -45;
    }
    rotateImage(angle, currentAngleOffset);
  };

  const isFilter = (f: Preset) => {
    return (
      f &&
      f.blur === currentFilter.blur &&
      f.brightness === currentFilter.brightness &&
      f.contrast === currentFilter.contrast &&
      f.grayscale === currentFilter.grayscale &&
      f.hueRotate === currentFilter.hueRotate &&
      f.invert === currentFilter.invert &&
      f.opacity === currentFilter.opacity &&
      f.saturation === currentFilter.saturation &&
      f.sepia === currentFilter.sepia
    );
  };

  const applyFilter = () => {
    if (!isFilter(presets[currentFilterName] as Preset)) {
      currentFilterName = 'custom';
    }

    // console.log('apply filter');
    // console.log(filter);
    imageElement.style.filter = `blur(${currentFilter.blur * 10}px) brightness(${currentFilter.brightness}) contrast(${
      currentFilter.contrast
    }) grayscale(${currentFilter.grayscale}) hue-rotate(${(currentFilter.hueRotate - 1) * 180}deg) invert(${
      currentFilter.invert
    }) opacity(${currentFilter.opacity}) saturate(${currentFilter.saturation}) sepia(${currentFilter.sepia})`;
    console.log('applied currentFilter');
  };

  onMount(async () => {
    isLoaded = false;
    try {
      await loadThumbData();
      await loadAssetData();
    } catch (error) {
      // Throw error
      handleError(error, 'Failed to load asset data');
    }
    imageElement.src = thumbData || assetData;
    imageElement.onload = () => {
      isLoaded = true;
      setAspectRatio('original');
    };
  });

  // Sets the filter to the preset passed in by the event
  const setPreset = (event: CustomEvent<string>) => {
    const preset = event.detail;
    currentFilter.blur = presets[preset].blur;
    currentFilter.brightness = presets[preset].brightness;
    currentFilter.contrast = presets[preset].contrast;
    currentFilter.grayscale = presets[preset].grayscale;
    currentFilter.hueRotate = presets[preset].hueRotate;
    currentFilter.invert = presets[preset].invert;
    currentFilter.opacity = presets[preset].opacity;
    currentFilter.saturation = presets[preset].saturation;
    currentFilter.sepia = presets[preset].sepia;
    applyFilter();
    currentFilterName = preset;
  };

  const loadAssetData = async () => {
    // Load original image
    try {
      const { data } = await api.assetApi.serveFile(
        { id: asset.id },
        {
          responseType: 'blob',
        },
      );

      if (!(data instanceof Blob)) {
        return;
      }
      assetBlob = data;
      assetData = URL.createObjectURL(data);
      originalImage = document.createElement('img');
      originalImage.src = assetData;

      //return assetData;
    } catch {
      // Do nothing
      console.log('Failed to load asset data');
    }
  };

  const loadThumbData = async () => {
    // Load thumbnail
    try {
      const { data } = await api.assetApi.serveFile(
        { id: asset.id, isThumb: true, isWeb: true, key: publicSharedKey },
        {
          responseType: 'blob',
        },
      );

      if (!(data instanceof Blob)) {
        return;
      }

      thumbData = URL.createObjectURL(data);
      //return thumbData;
    } catch {
      // Do nothing
      console.log('Failed to load thumb data');
    }
  };

  const navigateEditTab = async (button: 'autofix' | 'crop' | 'adjust' | 'filter') => {
    activeButton = button;
    const cropWrapperParent = cropElementWrapper.parentElement;

    //removeAngleSlider();
    //removeAssetDrag();
    //removeZoom();

    //TODO: better solution
    if (!cropWrapperParent) {
      return;
    }
    if (activeButton == 'crop') {
      //initAssetDrag();
      //initZoom();
      if (!cropWrapperParent.classList.contains('p-24')) {
        cropWrapperParent.classList.add('p-24');
        cropWrapperParent.classList.add('pb-52');
      }
      setAspectRatio(currentAspectRatio);
    }
  };

  const setAspectRatio = async (aspectRatio: string | aspectRatio, isRotate?: boolean) => {
    if (!imageElement || !cropElementWrapper || !cropElement || !imageWrapper) {
      return;
    }
    const originalAspect = imageElement.naturalWidth / imageElement.naturalHeight;

    if (isRotate) {
      if (!['free', 'square', 'original'].includes(aspectRatio)) {
        const strings = aspectRatio.split('_');
        aspectRatio = strings[1] + '_' + strings[0];
      }
      if (currentAngleOffset % 180 == 0) {
        //console.log('currentAngleOffset', currentAngleOffset);
        //console.log('isRotate', isRotate);
        isRotate = false;
      }
    }

    //console.log('isRotate', isRotate);

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
        if (currentAngleOffset % 180 !== 0) {
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
    const cropElementWrapperAspectRatio = cropElementWrapper.offsetWidth / cropElementWrapper.offsetHeight;

    //console.log('aspectRatioNum', aspectRatioNum);
    //console.log('cropElementWrapperAspectRatio', cropElementWrapperAspectRatio);

    if (aspectRatioNum >= 1 && cropElementWrapperAspectRatio >= 1 && aspectRatioNum < cropElementWrapperAspectRatio) {
      cropElement.style.width = 'auto';
      cropElement.style.height = '100%';
      //cropElement.style.maxHeight = '100%';
    } else if (
      aspectRatioNum >= 1 &&
      cropElementWrapperAspectRatio >= 1 &&
      aspectRatioNum > cropElementWrapperAspectRatio
    ) {
      cropElement.style.width = 'auto';
      cropElement.style.height = '100%';
    } else if (
      aspectRatioNum < 1 &&
      cropElementWrapperAspectRatio < 1 &&
      aspectRatioNum < cropElementWrapperAspectRatio
    ) {
      cropElement.style.width = 'auto';
      cropElement.style.height = '100%';
    } else if (aspectRatioNum < 1 && cropElementWrapperAspectRatio >= 1) {
      cropElement.style.width = 'auto';
      cropElement.style.height = '100%';
      //cropElement.style.maxHeight = '100%';
    } else if (aspectRatioNum >= 1 && cropElementWrapperAspectRatio < 1) {
      cropElement.style.width = '100%';
      cropElement.style.height = 'auto';
    } else {
      cropElement.style.width = '100%';
      cropElement.style.height = 'auto';
      //cropElement.style.maxWidth = '100%';
    }

    // Commenting the following line should fix translation not being persistent
    //currentTranslate = { x: 0, y: 0 };
    calcImageElement(currentAngle);
    setImageWrapperTransform();
  };

  // const initAssetDrag = async () => {
  //   console.log('initAssetDrag');
  //   let pos1 = 0,
  //     pos2 = 0,
  //     pos3 = 0,
  //     pos4 = 0;
  //   const closeDragElement = () => {
  //     // stop moving when mouse button is released:
  //     document.onmouseup = null;
  //     document.onmousemove = null;
  //   };

  //   const elementDrag = async (e: MouseEvent) => {
  //     if (activeButton !== 'crop') {
  //       return;
  //     }
  //     e.preventDefault();
  //     // calculate the new cursor position:
  //     pos1 = pos3 - e.clientX;
  //     pos2 = pos4 - e.clientY;
  //     pos3 = e.clientX;
  //     pos4 = e.clientY;

  //     if (currentAngleOffset === 90) {
  //       const temp = pos1;
  //       pos1 = -pos2;
  //       pos2 = temp;
  //     } else if (currentAngleOffset === 180) {
  //       pos1 = -pos1;
  //       pos2 = -pos2;
  //     } else if (currentAngleOffset === 270) {
  //       const temp = pos1;
  //       pos1 = pos2;
  //       pos2 = -temp;
  //     }

  //     let x = 0;
  //     let y = 0;

  //     //Calc max y translation
  //     let h1 = cropElement.offsetHeight;
  //     let w1 = cropElement.offsetWidth;

  //     if (currentAngleOffset === 90 || currentAngleOffset === 270) {
  //       const temp = h1;
  //       h1 = w1;
  //       w1 = temp;
  //     }

  //     // const h2 = w1 * Math.tan((Math.abs(currentAngle) * Math.PI) / 180);
  //     // const d = Math.cos((Math.abs(currentAngle) * Math.PI) / 180) * (h1 + h2);

  //     const a = Math.sin((Math.abs(currentAngle) * Math.PI) / 180) * w1;
  //     const b = Math.cos((Math.abs(currentAngle) * Math.PI) / 180) * h1;
  //     const d = a + b;

  //     let maxY = (imageWrapper.offsetHeight * currentZoom - d) / 2;

  //     maxY = maxY / currentZoom;

  //     // console.log('currentZoom', currentZoom);
  //     // console.log('offsetHeight', imageWrapper.offsetHeight);
  //     // console.log('realHight', imageWrapper.offsetHeight * currentZoom);
  //     // console.log('maxY', maxY);

  //     // Calc max x translation
  //     const h3 = Math.sin((Math.abs(currentAngle) * Math.PI) / 180) * h1;
  //     const h4 = Math.cos((Math.abs(currentAngle) * Math.PI) / 180) * w1;
  //     let maxX = (imageWrapper.offsetWidth * currentZoom - h3 - h4) / 2;
  //     maxX = maxX / currentZoom;
  //     //console.log('maxX', maxX);

  //     if (currentTranslate.x - pos1 > maxX) {
  //       x = maxX;
  //     } else if (currentTranslate.x - pos1 < -maxX) {
  //       x = -maxX;
  //     } else {
  //       x = currentTranslate.x - pos1;
  //     }

  //     if (currentTranslate.y - pos2 > maxY) {
  //       y = maxY;
  //     } else if (currentTranslate.y - pos2 < -maxY) {
  //       y = -maxY;
  //     } else {
  //       y = currentTranslate.y - pos2;
  //     }

  //     // console.log('y:', Math.round(y));
  //     // console.log('x:', Math.round(x));

  //     // Decide which direction to translate
  //     // if (currentTranslateDirection === 'y') {
  //     //   currentTranslate = {
  //     //     x: 0,
  //     //     y: y,
  //     //   };
  //     // } else if (currentTranslateDirection === 'x') {
  //     //   currentTranslate = {
  //     //     x: x,
  //     //     y: 0,
  //     //   };
  //     // } else {
  //     //   currentTranslate = {
  //     //     x: 0,
  //     //     y: 0,
  //     //   };
  //     // }
  //     currentTranslate = {
  //       x: x,
  //       y: y,
  //     };
  //     // console.log('currentTranslateBefore', currentTranslate);

  //     // console.log('currentTranslate', currentTranslate);
  //     setImageWrapperTransform();
  //   };

  //   const dragMouseDown = (e: MouseEvent) => {
  //     //console.log('dragMouseDown');

  //     e.preventDefault();
  //     // get the mouse cursor position at startup:
  //     pos3 = e.clientX;
  //     pos4 = e.clientY;
  //     document.onmouseup = closeDragElement;
  //     // call a function whenever the cursor moves:
  //     document.onmousemove = elementDrag;
  //   };
  //   assetDragHandle.onmousedown = dragMouseDown;
  // };

  // const removeAssetDrag = () => {
  //   assetDragHandle.onmousedown = null;
  //   document.onmouseup = null;
  //   document.onmousemove = null;
  // };

  // const removeAngleSlider = () => {
  //   angleSliderHandle.onmousedown = null;
  //   document.onmouseup = null;
  //   document.onmousemove = null;
  //   document.ontouchmove = null;
  //   document.ontouchend = null;
  //   angleSliderHandle.ontouchstart = null;
  // };

  // const removeZoom = () => {
  //   document.onwheel = null;
  // };

  const calcImageElement = (angle: number) => {
    // Get image wrapper width and height

    let newHeight;
    let newWidth;

    let originalAspect = imageElement.naturalWidth / imageElement.naturalHeight;

    if (currentAngleOffset === 90 || currentAngleOffset === 270) {
      originalAspect = 1 / originalAspect;
    }

    // Get crop element width and height
    const cropElementWidth = cropElement.offsetWidth;
    const cropElementHeight = cropElement.offsetHeight;

    // console.log('cropElementWidth', cropElementWidth);
    // console.log('cropElementHeight', cropElementHeight);

    const x1 = Math.cos((Math.abs(angle) * Math.PI) / 180) * cropElementWidth;
    const x2 = Math.cos(((90 - Math.abs(angle)) * Math.PI) / 180) * cropElementHeight;

    const y1 = Math.cos((Math.abs(angle) * Math.PI) / 180) * cropElementHeight;
    const y2 = Math.cos(((90 - Math.abs(angle)) * Math.PI) / 180) * cropElementWidth;

    if ((x1 + x2) / (y1 + y2) > originalAspect) {
      newWidth = `${x1 + x2}px`;
      newHeight = `${(x1 + x2) / originalAspect}px`;
      // console.log('Translation in Y possible');
      // console.log('case4');
      currentTranslateDirection = 'y';
    } else if ((x1 + x2) / (y1 + y2) < originalAspect) {
      newHeight = `${y1 + y2}px`;
      newWidth = `${(y1 + y2) / (1 / originalAspect)}px`;
      // console.log('Translation in X possible');
      currentTranslateDirection = 'x';
      // console.log('case5');
    } else {
      newHeight = `${y1 + y2}px`;
      newWidth = `${(y1 + y2) / (1 / originalAspect)}px`;
      currentTranslateDirection = '';
      // console.log('case6');
    }

    // Set image element width and height
    // console.log('newWidth', newWidth);
    // console.log('newHeight', newHeight);
    // console.log('currentAngleOffset', currentAngleOffset);
    // console.log('currentTranslateDirection', currentTranslateDirection);
    // console.log('currentTranslate', currentTranslate);
    // console.log('currentAngle', currentAngle);

    if (currentAngleOffset === 90 || currentAngleOffset === 270) {
      imageWrapper.style.height = newWidth;
      imageWrapper.style.width = newHeight;
      if (currentTranslateDirection === 'x') {
        currentTranslateDirection = 'y';
      } else if (currentTranslateDirection === 'y') {
        currentTranslateDirection = 'x';
      }
    } else {
      imageWrapper.style.height = newHeight;
      imageWrapper.style.width = newWidth;
    }
  };

  const navigateEdit = (edit: activeEdit) => {
    // console.log('navigateEdit');
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
    // Reset the image orientation.
    currentFlipX = false;
    currentFlipY = false;
    currentZoom = 1;
    rotateImage(0, 0);

    updateEditHistory();

    // Reset the aspect ratio.
    await setAspectRatio('original');
  };

  const flipVertical = async () => {
    currentFlipY = !currentFlipY;
    rotateImage(currentAngle, currentAngleOffset);
    updateEditHistory();
  };
  const flipHorizontal = async () => {
    currentFlipX = !currentFlipX;
    rotateImage(currentAngle, currentAngleOffset);
    updateEditHistory();
  };

  const rotateImage = async (angle: number, angleOffset: number, isRotate?: boolean) => {
    // If the angle offset is greater than 360 degrees, reset it back to 0
    if (angleOffset > 360) {
      angleOffset = angleOffset - 360;
    }

    // Set current angle and angle offset
    currentAngle = angle;
    currentAngleOffset = angleOffset;

    // Set aspect ratio
    setAspectRatio(currentAspectRatio, isRotate ? true : false);

    // Set slider handle position
    let a = -1 * angle * (125 / 49);
    if (!angleSlider || !angleSliderHandle) {
      return;
    }
    angleSliderHandle.style.left = a + 'px';
    angleSlider.style.left = a + 'px';
  };

  const save = async () => {
    // Save element
    if (isRendering) {
      return;
    }
    await renderElement.start();
  };

  // Set the transform of the image wrapper, which includes the rotation, translation, and scale.
  const setImageWrapperTransform = () => {
    let transformString = '';

    // Add rotation to the transform string.
    transformString += `rotate(${currentAngle - currentAngleOffset}deg)`;

    // If translation is non-zero, add it to the transform string.
    if (currentTranslate.x || currentTranslate.y) {
      transformString += ` translate(${currentTranslate.x * currentZoom}px, ${currentTranslate.y * currentZoom}px)`;
    }

    // Add scale to the transform string.
    transformString += ` scaleX(${(currentFlipX ? -1 : 1) * currentZoom}) scaleY(${
      (currentFlipY ? -1 : 1) * currentZoom
    })`;
    // Set the transform of the image wrapper.

    if (imageWrapper && imageWrapper.style) {
      console.log('Transforming');

      imageWrapper.style.transform = transformString;
    }
  };

  //TODO: Fix type
  const updateEditHistory = () => {
    console.log('updateEditHistory');
    editHistory.push({
      angle: currentAngle,
      angleOffset: currentAngleOffset,
      aspectRatio: currentAspectRatio,
      crop: currentCrop,
      flipX: currentFlipX,
      flipY: currentFlipY,
      filter: structuredClone(currentFilter),
      filterName: currentFilterName,
      translate: structuredClone(currentTranslate),
      zoom: currentZoom,
    });
    editHistoryIndex = editHistory.length - 1;
    console.log(editHistory);
  };

  const clearHistory = () => {
    editHistory.splice(1, editHistory.length - 1);
    console.log(editHistory.length);
    editHistoryIndex = 0;
  };

  const goBackInHistory = () => {
    if (editHistoryIndex > 0) {
      editHistoryIndex--;
      const edit = editHistory[editHistoryIndex];
      currentAngle = edit.angle;
      currentAngleOffset = edit.angleOffset;
      currentAspectRatio = edit.aspectRatio;
      currentCrop = structuredClone(edit.crop);
      currentFlipX = edit.flipX;
      currentFlipY = edit.flipY;
      currentFilter = edit.filter;
      currentFilterName = edit.filterName;
      currentZoom = edit.zoom;

      applyFilter();
      rotateImage(currentAngle, currentAngleOffset);
      setAspectRatio(currentAspectRatio);
      setImageWrapperTransform();
    }
  };

  const goForwardInHistory = () => {
    if (editHistoryIndex < editHistory.length - 1) {
      editHistoryIndex++;
      const edit = editHistory[editHistoryIndex];
      currentAngle = edit.angle;
      currentAngleOffset = edit.angleOffset;
      currentAspectRatio = edit.aspectRatio;
      currentCrop = edit.crop;
      currentFlipX = edit.flipX;
      currentFlipY = edit.flipY;
      currentFilter = edit.filter;
      currentFilterName = edit.filterName;
      currentZoom = edit.zoom;

      applyFilter();
      rotateImage(currentAngle, currentAngleOffset);
      setAspectRatio(currentAspectRatio);
      setImageWrapperTransform();
    }
  };

  let isZooming = false;
  const imageZoomHandler = (event: WheelEvent) => {
    if (event.deltaY > 0) {
      if (currentZoom <= 5) {
        currentZoom += zoomSpeed * 5;
      }
    } else {
      if (currentZoom > 1) {
        currentZoom -= zoomSpeed * 5;
      }
    }
    setImageWrapperTransform();
    if (!isZooming) {
      setTimeout(() => {
        updateEditHistory();
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

    <!-- goBackInHistory Button -->
    <button
      on:click={() => goBackInHistory()}
      disabled={!(editHistory.length > 0 && editHistoryIndex > 0)}
      class="hover:bg-immich-gray/10 ml-4 rounded-full p-3 text-2xl text-white ml-auto disabled:text-gray-500 disabled:bg-transparent disabled:cursor-not-allowed"
    >
      <Icon path={mdiUndo} />
    </button>

    <!-- goForwardInHistory -->
    <button
      on:click={() => goForwardInHistory()}
      disabled={!(editHistory.length > 0 && editHistoryIndex < editHistory.length - 1)}
      class="hover:bg-immich-gray/10 ml-4 rounded-full p-3 text-2xl text-white disabled:text-gray-500 disabled:bg-transparent disabled:cursor-not-allowed"
    >
      <Icon path={mdiRedo} />
    </button>

    <button
      on:click={() => save()}
      disabled={isRendering}
      class=" {isRendering
        ? 'bg-immich-dark-primary/50 hover:cursor-wait'
        : 'bg-immich-dark-primary hover:bg-immich-dark-primary/80 '}  ml-4 mr-5 inline-flex items-center rounded-md p-[6px] px-4 text-black"
    >
      <svg
        class="-ml-1 mr-3 h-5 w-5 animate-spin text-black {isRendering ? '' : 'hidden'}"
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
      Save
    </button>
    <div use:clickOutside on:outclick={() => (isShowEditOptions = false)}>
      <CircleIconButton isOpacity={true} icon={mdiDotsVertical} on:click={showOptionsMenu} title="More" />
      {#if isShowEditOptions}
        <ContextMenu {...contextMenuPosition} direction="left">
          <MenuOption on:click={clearHistory} text="Clear History" />
        </ContextMenu>
      {/if}
    </div>
  </div>
  <div class="relative col-span-3 col-start-1 row-span-full row-start-1">
    <!-- TODO: fix only allow drag from crop Element or imageWrapper -->
    <div
      class="flex h-full w-full justify-center"
      use:pinch={{ enable: true }}
      use:pan
      on:pan={imagePanHandler}
      on:panend={updateEditHistory}
      on:pinch={imagePinchHandler}
      on:pinchend={updateEditHistory}
      on:wheel={imageZoomHandler}
    >
      <div class="flex hidden h-full w-full items-center justify-center" bind:this={editorElement} />
      <div class="-z-10 flex h-full w-full items-center justify-center">
        <div bind:this={cropElementWrapper} class="relative flex h-full w-full items-center justify-center">
          <div>
            <div bind:this={imageWrapper}>
              <div
                class="{isLoaded
                  ? 'hidden'
                  : 'flex'} absolute left-0 top-0 w-full h-full bg-black justify-center items-center gap-1"
              >
                <span>Loading</span>
                <LoadingSpinner />
              </div>
              <img class="h-full w-full {isLoaded ? '' : 'hidden'}" bind:this={imageElement} src="" alt="" />
            </div>
            <div
              bind:this={cropElement}
              id="cropElement"
              class="absolute left-1/2 top-1/2 z-[1004] mx-auto -translate-x-1/2 -translate-y-1/2 bg-transparent {activeButton ===
              'crop'
                ? 'shadow-[0_0_5000px_5000px_rgba(0,0,0,0.8)]'
                : 'shadow-[0_0_5000px_5000px_#000000]'}"
            >
              {#if activeButton === 'crop'}
                <div class="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-white" />
                <div class="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-white" />
                <div class="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-white" />
                <div class="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-white" />
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      class="{activeButton === 'crop'
        ? ''
        : 'hidden'} h-26 bg-immich-dark-bg absolute bottom-0 flex w-full justify-center gap-0 px-4 py-2"
    >
      <div class="grid h-full w-full max-w-[750px] grid-cols-[1fr,1fr,500px,2fr] grid-rows-1 items-center">
        <!-- Crop Options -->
        <div class="z-10 flex h-full w-full flex-col justify-center bg-black">
          <button
            on:click={() => flipHorizontal()}
            class="hover:bg-immich-gray/10 rounded-full p-3 text-2xl text-white"
          >
            <Icon path={mdiFlipHorizontal} />
          </button>

          <button on:click={() => flipVertical()} class="hover:bg-immich-gray/10 rounded-full p-3 text-2xl text-white">
            <Icon path={mdiFlipVertical} />
          </button>
        </div>
        <div class="z-10 flex h-full w-full items-center justify-center bg-black">
          <button on:click={() => rotate90()} class="hover:bg-immich-gray/10 rounded-full p-3 text-2xl text-white">
            <Icon path={mdiFormatRotate90} />
          </button>
        </div>

        <div class="relative z-3000 h-[50px] w-[500px]" use:pan on:pan={anglePanHandler} on:panend={updateEditHistory}>
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
              <Icon path={mdiTriangleSmallUp} size="1.5em" />
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
      <Icon path={mdiAutoFix} size="1.5em" />
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
      <Icon path={mdiCropRotate} size="1.5em" />
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
      <Icon path={mdiTune} size="1.5em" />
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
      <Icon path={mdiImageAutoAdjust} size="1.5em" />
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
            <Icon path={mdiFullscreen} size="1.5em" />
          </AspectRatioButton>
          <AspectRatioButton
            on:click={() => setAspectRatio('original')}
            isActive={currentAspectRatio === 'original'}
            title="Original"
          >
            <Icon path={mdiRelativeScale} size="1.5em" />
          </AspectRatioButton>
          <AspectRatioButton
            on:click={() => setAspectRatio('16_9')}
            isActive={currentAspectRatio === '16_9'}
            title="16:9"
          >
            <Icon path={mdiRectangleOutline} size="1.5em" />
          </AspectRatioButton>
          <AspectRatioButton
            on:click={() => setAspectRatio('9_16')}
            isActive={currentAspectRatio === '9_16'}
            title="9:16"
          >
            <Icon path={mdiRectangleOutline} size="1.5em" />
          </AspectRatioButton>
          <AspectRatioButton on:click={() => setAspectRatio('5_4')} isActive={currentAspectRatio === '5_4'} title="5:4">
            <Icon path={mdiRectangleOutline} size="1.5em" />
          </AspectRatioButton>
          <AspectRatioButton on:click={() => setAspectRatio('4_5')} isActive={currentAspectRatio === '4_5'} title="4:5">
            <Icon path={mdiRectangleOutline} size="1.5em" />
          </AspectRatioButton>
          <AspectRatioButton on:click={() => setAspectRatio('4_3')} isActive={currentAspectRatio === '4_3'} title="4:3">
            <Icon path={mdiRectangleOutline} size="1.5em" />
          </AspectRatioButton>
          <AspectRatioButton on:click={() => setAspectRatio('3_4')} isActive={currentAspectRatio === '3_4'} title="3:4">
            <Icon path={mdiRectangleOutline} size="1.5em" />
          </AspectRatioButton>
          <AspectRatioButton on:click={() => setAspectRatio('3_2')} isActive={currentAspectRatio === '3_2'} title="3:2">
            <Icon path={mdiRectangleOutline} size="1.5em" />
          </AspectRatioButton>
          <AspectRatioButton on:click={() => setAspectRatio('2_3')} isActive={currentAspectRatio === '2_3'} title="2:3">
            <Icon path={mdiRectangleOutline} size="1.5em" />
          </AspectRatioButton>
          <AspectRatioButton
            on:click={() => setAspectRatio('square')}
            isActive={currentAspectRatio === 'square'}
            title="Square"
          >
            <Icon path={mdiSquareOutline} size="1.5em" />
          </AspectRatioButton>
        </div>
      </div>
    {:else if activeButton === 'adjust'}
      <div class="grid gap-y-2 px-6 pt-2">
        <!-- Adjust -->
        <div class="grid gap-y-8">
          <AdjustElement
            title="Brightness"
            type={true}
            bind:value={currentFilter.brightness}
            on:applyFilter={applyFilter}
            on:updateHistory={updateEditHistory}
          >
            <Icon path={mdiBrightness6} size="1.5em" />
          </AdjustElement>
          <AdjustElement
            title="Contrast"
            type={true}
            bind:value={currentFilter.contrast}
            on:applyFilter={applyFilter}
            on:updateHistory={updateEditHistory}
          >
            <Icon path={mdiContrastCircle} size="1.5em" />
          </AdjustElement>
          <AdjustElement
            title="Saturation"
            type={true}
            bind:value={currentFilter.saturation}
            on:applyFilter={applyFilter}
            on:updateHistory={updateEditHistory}
          >
            <Icon path={mdiInvertColors} size="1.5em" />
          </AdjustElement>
          <AdjustElement
            title="Blur"
            type={false}
            bind:value={currentFilter.blur}
            on:applyFilter={applyFilter}
            on:updateHistory={updateEditHistory}
          >
            <Icon path={mdiBlur} size="1.5em" />
          </AdjustElement>
          <AdjustElement
            title="Grayscale"
            type={false}
            bind:value={currentFilter.grayscale}
            on:applyFilter={applyFilter}
            on:updateHistory={updateEditHistory}
          >
            <Icon path={mdiCircleHalfFull} size="1.5em" />
          </AdjustElement>
          <AdjustElement
            title="Hue Rotate"
            type={true}
            bind:value={currentFilter.hueRotate}
            on:applyFilter={applyFilter}
            on:updateHistory={updateEditHistory}
          >
            <Icon path={mdiDotsCircle} size="1.5em" />
          </AdjustElement>
          <AdjustElement
            title="Invert"
            type={false}
            bind:value={currentFilter.invert}
            on:applyFilter={applyFilter}
            on:updateHistory={updateEditHistory}
          >
            <Icon path={mdiSelectInverse} size="1.5em" />
          </AdjustElement>
          <AdjustElement
            title="Sepia"
            type={false}
            bind:value={currentFilter.sepia}
            on:applyFilter={applyFilter}
            on:updateHistory={updateEditHistory}
          >
            <Icon path={mdiPillar} size="1.5em" />
          </AdjustElement>
        </div>
      </div>
    {:else if activeButton === 'filter'}
      <div class="grid justify-center px-6 pt-2">
        <!-- Filter -->
        <div class="grid grid-cols-3 gap-x-3">
          <FilterCard
            title="Custom"
            {currentFilterName}
            on:setPreset={setPreset}
            {thumbData}
            on:updateHistory={updateEditHistory}
          />
          <FilterCard
            title="Without"
            {currentFilterName}
            on:setPreset={setPreset}
            {thumbData}
            on:updateHistory={updateEditHistory}
          />
          <FilterCard
            title="Vivid"
            {currentFilterName}
            on:setPreset={setPreset}
            {thumbData}
            on:updateHistory={updateEditHistory}
          />
        </div>
        <hr class="border-1 border-immich-gray/10 mx-4 my-7" />
        <div class="grid grid-cols-3 gap-x-3">
          <FilterCard
            title="Playa"
            {currentFilterName}
            on:setPreset={setPreset}
            {thumbData}
            on:updateHistory={updateEditHistory}
          />
          <FilterCard
            title="Honey"
            {currentFilterName}
            on:setPreset={setPreset}
            {thumbData}
            on:updateHistory={updateEditHistory}
          />
          <FilterCard
            title="Isla"
            {currentFilterName}
            on:setPreset={setPreset}
            {thumbData}
            on:updateHistory={updateEditHistory}
          />
          <FilterCard
            title="Desert"
            {currentFilterName}
            on:setPreset={setPreset}
            {thumbData}
            on:updateHistory={updateEditHistory}
          />
          <FilterCard
            title="Clay"
            {currentFilterName}
            on:setPreset={setPreset}
            {thumbData}
            on:updateHistory={updateEditHistory}
          />
          <FilterCard
            title="Palma"
            {currentFilterName}
            on:setPreset={setPreset}
            {thumbData}
            on:updateHistory={updateEditHistory}
          />
          <FilterCard
            title="Blush"
            {currentFilterName}
            on:setPreset={setPreset}
            {thumbData}
            on:updateHistory={updateEditHistory}
          />
          <FilterCard
            title="Alpaca"
            {currentFilterName}
            on:setPreset={setPreset}
            {thumbData}
            on:updateHistory={updateEditHistory}
          />
          <FilterCard
            title="Modena"
            {currentFilterName}
            on:setPreset={setPreset}
            {thumbData}
            on:updateHistory={updateEditHistory}
          />
        </div>
        <hr class="border-1 border-immich-gray/10 mx-4 my-7" />
        <div class="grid grid-cols-3 gap-x-3">
          <FilterCard
            title="West"
            {currentFilterName}
            on:setPreset={setPreset}
            {thumbData}
            on:updateHistory={updateEditHistory}
          />
          <FilterCard
            title="Metro"
            {currentFilterName}
            on:setPreset={setPreset}
            {thumbData}
            on:updateHistory={updateEditHistory}
          />
          <FilterCard
            title="Reel"
            {currentFilterName}
            on:setPreset={setPreset}
            {thumbData}
            on:updateHistory={updateEditHistory}
          />
          <FilterCard
            title="Bazaar"
            {currentFilterName}
            on:setPreset={setPreset}
            {thumbData}
            on:updateHistory={updateEditHistory}
          />
          <FilterCard
            title="Ollie"
            {currentFilterName}
            on:setPreset={setPreset}
            {thumbData}
            on:updateHistory={updateEditHistory}
          />
        </div>
        <hr class="border-1 border-immich-gray/10 mx-4 my-7" />
        <div class="grid grid-cols-3 gap-x-3">
          <FilterCard
            title="Onyx"
            {currentFilterName}
            on:setPreset={setPreset}
            {thumbData}
            on:updateHistory={updateEditHistory}
          />
          <FilterCard
            title="Eiffel"
            {currentFilterName}
            on:setPreset={setPreset}
            {thumbData}
            on:updateHistory={updateEditHistory}
          />
          <FilterCard
            title="Vogue"
            {currentFilterName}
            on:setPreset={setPreset}
            {thumbData}
            on:updateHistory={updateEditHistory}
          />
          <FilterCard
            title="Vista"
            {currentFilterName}
            on:setPreset={setPreset}
            {thumbData}
            on:updateHistory={updateEditHistory}
          />
        </div>
      </div>
    {/if}
  </div>
  <Render
    bind:this={renderElement}
    angle={currentAngle - currentAngleOffset}
    scale={currentZoom}
    translate={currentTranslate}
    crop={currentCrop}
    ratio={currentRatio}
    filter={currentFilter}
    {assetBlob}
    assetName={asset.originalFileName}
    flipX={currentFlipX}
    flipY={currentFlipY}
    bind:isRendering
  />
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
