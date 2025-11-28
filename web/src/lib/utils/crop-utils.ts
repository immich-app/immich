import { cropManager, type CropAspectRatio, type CropSettings } from '$lib/managers/edit/crop-manager.svelte';
import { editManager } from '$lib/managers/edit/edit-manager.svelte';

export function recalculateCrop(crop: CropSettings, canvas: HTMLElement, aspectRatio: CropAspectRatio): CropSettings {
  const canvasW = canvas.clientWidth;
  const canvasH = canvas.clientHeight;

  let newWidth = crop.width;
  let newHeight = crop.height;

  const { newWidth: w, newHeight: h } = keepAspectRatio(newWidth, newHeight, aspectRatio);

  if (w > canvasW) {
    newWidth = canvasW;
    newHeight = canvasW / (w / h);
  } else if (h > canvasH) {
    newHeight = canvasH;
    newWidth = canvasH * (w / h);
  } else {
    newWidth = w;
    newHeight = h;
  }

  const newX = Math.max(0, Math.min(crop.x, canvasW - newWidth));
  const newY = Math.max(0, Math.min(crop.y, canvasH - newHeight));

  const newCrop = {
    width: newWidth,
    height: newHeight,
    x: newX,
    y: newY,
  };

  return newCrop;
}

export function animateCropChange(element: HTMLElement, from: CropSettings, to: CropSettings, duration = 100) {
  const cropFrame = element.querySelector('.crop-frame') as HTMLElement;
  if (!cropFrame) {
    return;
  }

  const startTime = performance.now();
  const initialCrop = { ...from };

  const animate = (currentTime: number) => {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);

    from.x = initialCrop.x + (to.x - initialCrop.x) * progress;
    from.y = initialCrop.y + (to.y - initialCrop.y) * progress;
    from.width = initialCrop.width + (to.width - initialCrop.width) * progress;
    from.height = initialCrop.height + (to.height - initialCrop.height) * progress;

    draw(from);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
}

export function keepAspectRatio(newWidth: number, newHeight: number, aspectRatio: CropAspectRatio) {
  const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);

  if (widthRatio && heightRatio) {
    const calculatedWidth = (newHeight * widthRatio) / heightRatio;
    return { newWidth: calculatedWidth, newHeight };
  }

  return { newWidth, newHeight };
}

export function adjustDimensions(
  newWidth: number,
  newHeight: number,
  aspectRatio: CropAspectRatio,
  xLimit: number,
  yLimit: number,
  minSize: number,
) {
  let w = newWidth;
  let h = newHeight;

  let aspectMultiplier: number;

  if (aspectRatio === 'free') {
    aspectMultiplier = newWidth / newHeight;
  } else {
    const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
    aspectMultiplier = widthRatio && heightRatio ? widthRatio / heightRatio : newWidth / newHeight;
  }

  if (aspectRatio !== 'free') {
    h = w / aspectMultiplier;
  }

  if (w > xLimit) {
    w = xLimit;
    if (aspectRatio !== 'free') {
      h = w / aspectMultiplier;
    }
  }
  if (h > yLimit) {
    h = yLimit;
    if (aspectRatio !== 'free') {
      w = h * aspectMultiplier;
    }
  }

  if (w < minSize) {
    w = minSize;
    if (aspectRatio !== 'free') {
      h = w / aspectMultiplier;
    }
  }
  if (h < minSize) {
    h = minSize;
    if (aspectRatio !== 'free') {
      w = h * aspectMultiplier;
    }
  }

  if (aspectRatio !== 'free' && w / h !== aspectMultiplier) {
    if (w < minSize) {
      h = w / aspectMultiplier;
    }
    if (h < minSize) {
      w = h * aspectMultiplier;
    }
  }

  return { newWidth: w, newHeight: h };
}

export function draw(crop: CropSettings) {
  const mCropFrame = cropManager.cropFrame;

  if (!mCropFrame) {
    return;
  }

  mCropFrame.style.left = `${crop.x}px`;
  mCropFrame.style.top = `${crop.y}px`;
  mCropFrame.style.width = `${crop.width}px`;
  mCropFrame.style.height = `${crop.height}px`;

  drawOverlay(crop);
}

export function drawOverlay(crop: CropSettings) {
  const overlay = cropManager.overlayEl;
  if (!overlay) {
    return;
  }

  overlay.style.clipPath = `
    polygon(
      0% 0%,
      0% 100%,
      100% 100%,
      100% 0%,
      0% 0%,
      ${crop.x}px ${crop.y}px,
      ${crop.x + crop.width}px ${crop.y}px,
      ${crop.x + crop.width}px ${crop.y + crop.height}px,
      ${crop.x}px ${crop.y + crop.height}px,
      ${crop.x}px ${crop.y}px
    )
  `;
}

export function onImageLoad(resetSize: boolean = false) {
  const img = cropManager.imgElement;
  const cropArea = cropManager.cropAreaEl;

  if (!cropArea || !img) {
    return;
  }

  const containerWidth = cropArea.clientWidth ?? 0;
  const containerHeight = cropArea.clientHeight ?? 0;

  const scale = calculateScale(img, containerWidth, containerHeight);

  cropManager.cropImageSize = [img.width, img.height];

  if (resetSize) {
    cropManager.region = {
      x: 0,
      y: 0,
      width: img.width * scale,
      height: img.height * scale,
    };
  } else {
    const cropFrameEl = cropManager.cropFrame;
    cropFrameEl?.classList.add('transition');
    cropManager.region = normalizeCropArea(cropManager.region, img, scale);
    cropFrameEl?.classList.add('transition');
    cropFrameEl?.addEventListener('transitionend', () => cropFrameEl?.classList.remove('transition'), {
      passive: true,
    });
  }
  cropManager.cropImageScale = scale;

  img.style.width = `${img.width * scale}px`;
  img.style.height = `${img.height * scale}px`;

  draw(cropManager.region);
}

export function calculateScale(img: HTMLImageElement, containerWidth: number, containerHeight: number): number {
  const imageAspectRatio = img.width / img.height;
  let scale: number;

  if (imageAspectRatio > 1) {
    scale = containerWidth / img.width;
    if (img.height * scale > containerHeight) {
      scale = containerHeight / img.height;
    }
  } else {
    scale = containerHeight / img.height;
    if (img.width * scale > containerWidth) {
      scale = containerWidth / img.width;
    }
  }

  return scale;
}

export function normalizeCropArea(crop: CropSettings, img: HTMLImageElement, scale: number) {
  const prevScale = cropManager.cropImageScale;
  const scaleRatio = scale / prevScale;

  crop.x *= scaleRatio;
  crop.y *= scaleRatio;
  crop.width *= scaleRatio;
  crop.height *= scaleRatio;

  crop.width = Math.min(crop.width, img.width * scale);
  crop.height = Math.min(crop.height, img.height * scale);
  crop.x = Math.max(0, Math.min(crop.x, img.width * scale - crop.width));
  crop.y = Math.max(0, Math.min(crop.y, img.height * scale - crop.height));

  return crop;
}

export function resizeCanvas() {
  const img = cropManager.imgElement;
  const cropArea = cropManager.cropAreaEl;

  if (!cropArea || !img) {
    return;
  }

  const containerWidth = cropArea?.clientWidth ?? 0;
  const containerHeight = cropArea?.clientHeight ?? 0;
  const imageAspectRatio = img.width / img.height;

  let scale;
  if (imageAspectRatio > 1) {
    scale = containerWidth / img.width;
    if (img.height * scale > containerHeight) {
      scale = containerHeight / img.height;
    }
  } else {
    scale = containerHeight / img.height;
    if (img.width * scale > containerWidth) {
      scale = containerWidth / img.width;
    }
  }

  img.style.width = `${img.width * scale}px`;
  img.style.height = `${img.height * scale}px`;

  const cropFrame = cropArea.querySelector('.crop-frame') as HTMLElement;
  if (cropFrame) {
    cropFrame.style.width = `${img.width * scale}px`;
    cropFrame.style.height = `${img.height * scale}px`;
  }

  draw(cropManager.region);
}

export function handleMouseDown(e: MouseEvent) {
  const canvas = cropManager.cropAreaEl;
  if (!canvas) {
    return;
  }

  const crop = cropManager.region;
  const { mouseX, mouseY } = getMousePosition(e);

  const {
    onLeftBoundary,
    onRightBoundary,
    onTopBoundary,
    onBottomBoundary,
    onTopLeftCorner,
    onTopRightCorner,
    onBottomLeftCorner,
    onBottomRightCorner,
  } = isOnCropBoundary(mouseX, mouseY, crop, cropManager.cropImageSize);

  if (
    onTopLeftCorner ||
    onTopRightCorner ||
    onBottomLeftCorner ||
    onBottomRightCorner ||
    onLeftBoundary ||
    onRightBoundary ||
    onTopBoundary ||
    onBottomBoundary
  ) {
    setResizeSide(mouseX, mouseY);
  } else if (isInCropArea(mouseX, mouseY, crop)) {
    startDragging(mouseX, mouseY);
  }

  document.body.style.userSelect = 'none';
  globalThis.addEventListener('mouseup', handleMouseUp, { passive: true });
}

export function handleMouseMove(e: MouseEvent) {
  const canvas = cropManager.cropAreaEl;
  if (!canvas) {
    return;
  }

  const resizeSideValue = cropManager.resizeSide;
  const { mouseX, mouseY } = getMousePosition(e);

  if (cropManager.isDragging) {
    moveCrop(mouseX, mouseY);
  } else if (resizeSideValue) {
    resizeCrop(mouseX, mouseY);
  } else {
    updateCursor(mouseX, mouseY);
  }
}

export function handleMouseUp() {
  globalThis.removeEventListener('mouseup', handleMouseUp);
  document.body.style.userSelect = '';
  stopInteraction();
}

function getMousePosition(e: MouseEvent) {
  let offsetX = e.clientX;
  let offsetY = e.clientY;
  const clienRect = getBoundingClientRectCached(cropManager.cropAreaEl);
  const rotateDeg = cropManager.normalizedRotation;

  if (rotateDeg == 90) {
    offsetX = e.clientY - (clienRect?.top ?? 0);
    offsetY = window.innerWidth - e.clientX - (window.innerWidth - (clienRect?.right ?? 0));
  } else if (rotateDeg == 180) {
    offsetX = window.innerWidth - e.clientX - (window.innerWidth - (clienRect?.right ?? 0));
    offsetY = window.innerHeight - e.clientY - (window.innerHeight - (clienRect?.bottom ?? 0));
  } else if (rotateDeg == 270) {
    offsetX = window.innerHeight - e.clientY - (window.innerHeight - (clienRect?.bottom ?? 0));
    offsetY = e.clientX - (clienRect?.left ?? 0);
  } else if (rotateDeg == 0) {
    offsetX -= clienRect?.left ?? 0;
    offsetY -= clienRect?.top ?? 0;
  }
  return { mouseX: offsetX, mouseY: offsetY };
}

// TODO: is this needed?
// type BoundingClientRect = ReturnType<HTMLElement['getBoundingClientRect']>;
// let getBoundingClientRectCache: { data: BoundingClientRect | null; time: number } = {
//   data: null,
//   time: 0,
// };
// cropManager.normalizedRotation.subscribe(() => {
//   getBoundingClientRectCache.time = 0;
// });
function getBoundingClientRectCached(el: HTMLElement | null) {
  return el?.getBoundingClientRect();
}

function isOnCropBoundary(mouseX: number, mouseY: number, crop: CropSettings, cropSize: number[]) {
  const { x, y, width, height } = crop;
  const sensitivity = 10;
  const cornerSensitivity = 15;

  const outOfBound = mouseX > cropSize[0] || mouseY > cropSize[1] || mouseX < 0 || mouseY < 0;
  if (outOfBound) {
    return {
      onLeftBoundary: false,
      onRightBoundary: false,
      onTopBoundary: false,
      onBottomBoundary: false,
      onTopLeftCorner: false,
      onTopRightCorner: false,
      onBottomLeftCorner: false,
      onBottomRightCorner: false,
    };
  }

  const onLeftBoundary = mouseX >= x - sensitivity && mouseX <= x + sensitivity && mouseY >= y && mouseY <= y + height;
  const onRightBoundary =
    mouseX >= x + width - sensitivity && mouseX <= x + width + sensitivity && mouseY >= y && mouseY <= y + height;
  const onTopBoundary = mouseY >= y - sensitivity && mouseY <= y + sensitivity && mouseX >= x && mouseX <= x + width;
  const onBottomBoundary =
    mouseY >= y + height - sensitivity && mouseY <= y + height + sensitivity && mouseX >= x && mouseX <= x + width;

  const onTopLeftCorner =
    mouseX >= x - cornerSensitivity &&
    mouseX <= x + cornerSensitivity &&
    mouseY >= y - cornerSensitivity &&
    mouseY <= y + cornerSensitivity;
  const onTopRightCorner =
    mouseX >= x + width - cornerSensitivity &&
    mouseX <= x + width + cornerSensitivity &&
    mouseY >= y - cornerSensitivity &&
    mouseY <= y + cornerSensitivity;
  const onBottomLeftCorner =
    mouseX >= x - cornerSensitivity &&
    mouseX <= x + cornerSensitivity &&
    mouseY >= y + height - cornerSensitivity &&
    mouseY <= y + height + cornerSensitivity;
  const onBottomRightCorner =
    mouseX >= x + width - cornerSensitivity &&
    mouseX <= x + width + cornerSensitivity &&
    mouseY >= y + height - cornerSensitivity &&
    mouseY <= y + height + cornerSensitivity;

  return {
    onLeftBoundary,
    onRightBoundary,
    onTopBoundary,
    onBottomBoundary,
    onTopLeftCorner,
    onTopRightCorner,
    onBottomLeftCorner,
    onBottomRightCorner,
  };
}

function isInCropArea(mouseX: number, mouseY: number, crop: CropSettings) {
  const { x, y, width, height } = crop;
  return mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height;
}

function setResizeSide(mouseX: number, mouseY: number) {
  const crop = cropManager.region;
  const {
    onLeftBoundary,
    onRightBoundary,
    onTopBoundary,
    onBottomBoundary,
    onTopLeftCorner,
    onTopRightCorner,
    onBottomLeftCorner,
    onBottomRightCorner,
  } = isOnCropBoundary(mouseX, mouseY, crop, cropManager.cropImageSize);

  if (onTopLeftCorner) {
    cropManager.resizeSide = 'top-left';
  } else if (onTopRightCorner) {
    cropManager.resizeSide = 'top-right';
  } else if (onBottomLeftCorner) {
    cropManager.resizeSide = 'bottom-left';
  } else if (onBottomRightCorner) {
    cropManager.resizeSide = 'bottom-right';
  } else if (onLeftBoundary) {
    cropManager.resizeSide = 'left';
  } else if (onRightBoundary) {
    cropManager.resizeSide = 'right';
  } else if (onTopBoundary) {
    cropManager.resizeSide = 'top';
  } else if (onBottomBoundary) {
    cropManager.resizeSide = 'bottom';
  }
}

function startDragging(mouseX: number, mouseY: number) {
  cropManager.isDragging = true;
  const crop = cropManager.region;
  cropManager.isInteracting = true;
  cropManager.dragOffset = { x: mouseX - crop.x, y: mouseY - crop.y };
  fadeOverlay(false);
}

function moveCrop(mouseX: number, mouseY: number) {
  const cropArea = cropManager.cropAreaEl;
  if (!cropArea) {
    return;
  }

  const crop = cropManager.region;
  const { x, y } = cropManager.dragOffset;

  let newX = mouseX - x;
  let newY = mouseY - y;

  newX = Math.max(0, Math.min(cropArea.clientWidth - crop.width, newX));
  newY = Math.max(0, Math.min(cropArea.clientHeight - crop.height, newY));

  cropManager.region = {
    ...cropManager.region,
    x: newX,
    y: newY,
  };

  draw(cropManager.region);
}

function resizeCrop(mouseX: number, mouseY: number) {
  const canvas = cropManager.cropAreaEl;
  const crop = cropManager.region;
  const resizeSideValue = cropManager.resizeSide;
  if (!canvas || !resizeSideValue) {
    return;
  }
  fadeOverlay(false);

  const { x, y, width, height } = crop;
  const minSize = 50;
  let newWidth = width;
  let newHeight = height;
  switch (resizeSideValue) {
    case 'left': {
      newWidth = width + x - mouseX;
      newHeight = height;
      if (newWidth >= minSize && mouseX >= 0) {
        const { newWidth: w, newHeight: h } = keepAspectRatio(newWidth, newHeight, cropManager.settings.aspectRatio);
        cropManager.region = {
          ...cropManager.region,
          width: Math.max(minSize, Math.min(w, canvas.clientWidth)),
          height: Math.max(minSize, Math.min(h, canvas.clientHeight)),
          x: Math.max(0, x + width - cropManager.region.width),
        };
      }
      break;
    }
    case 'right': {
      newWidth = mouseX - x;
      newHeight = height;
      if (newWidth >= minSize && mouseX <= canvas.clientWidth) {
        const { newWidth: w, newHeight: h } = keepAspectRatio(newWidth, newHeight, cropManager.settings.aspectRatio);
        cropManager.region = {
          ...cropManager.region,
          width: Math.max(minSize, Math.min(w, canvas.clientWidth - x)),
          height: Math.max(minSize, Math.min(h, canvas.clientHeight)),
        };
      }
      break;
    }
    case 'top': {
      newHeight = height + y - mouseY;
      newWidth = width;
      if (newHeight >= minSize && mouseY >= 0) {
        const { newWidth: w, newHeight: h } = adjustDimensions(
          newWidth,
          newHeight,
          cropManager.settings.aspectRatio,
          canvas.clientWidth,
          canvas.clientHeight,
          minSize,
        );
        cropManager.region = {
          ...cropManager.region,
          y: Math.max(0, y + height - h),
          width: w,
          height: h,
        };
      }
      break;
    }
    case 'bottom': {
      newHeight = mouseY - y;
      newWidth = width;
      if (newHeight >= minSize && mouseY <= canvas.clientHeight) {
        const { newWidth: w, newHeight: h } = adjustDimensions(
          newWidth,
          newHeight,
          cropManager.settings.aspectRatio,
          canvas.clientWidth,
          canvas.clientHeight - y,
          minSize,
        );
        cropManager.region = {
          ...cropManager.region,
          width: w,
          height: h,
        };
      }
      break;
    }
    case 'top-left': {
      newWidth = width + x - Math.max(mouseX, 0);
      newHeight = height + y - Math.max(mouseY, 0);
      const { newWidth: w, newHeight: h } = adjustDimensions(
        newWidth,
        newHeight,
        cropManager.settings.aspectRatio,
        canvas.clientWidth,
        canvas.clientHeight,
        minSize,
      );
      cropManager.region = {
        width: w,
        height: h,
        x: Math.max(0, x + width - w),
        y: Math.max(0, y + height - h),
      };

      break;
    }
    case 'top-right': {
      newWidth = Math.max(mouseX, 0) - x;
      newHeight = height + y - Math.max(mouseY, 0);
      const { newWidth: w, newHeight: h } = adjustDimensions(
        newWidth,
        newHeight,
        cropManager.settings.aspectRatio,
        canvas.clientWidth - x,
        y + height,
        minSize,
      );
      cropManager.region = {
        ...cropManager.region,
        width: w,
        height: h,
        y: Math.max(0, y + height - h),
      };
      break;
    }
    case 'bottom-left': {
      newWidth = width + x - Math.max(mouseX, 0);
      newHeight = Math.max(mouseY, 0) - y;
      const { newWidth: w, newHeight: h } = adjustDimensions(
        newWidth,
        newHeight,
        cropManager.settings.aspectRatio,
        canvas.clientWidth,
        canvas.clientHeight - y,
        minSize,
      );
      cropManager.region = {
        ...cropManager.region,
        width: w,
        height: h,
        x: Math.max(0, x + width - w),
      };
      break;
    }
    case 'bottom-right': {
      newWidth = Math.max(mouseX, 0) - x;
      newHeight = Math.max(mouseY, 0) - y;
      const { newWidth: w, newHeight: h } = adjustDimensions(
        newWidth,
        newHeight,
        cropManager.settings.aspectRatio,
        canvas.clientWidth - x,
        canvas.clientHeight - y,
        minSize,
      );
      cropManager.region = {
        ...cropManager.region,
        width: w,
        height: h,
      };
      break;
    }
  }

  cropManager.region = {
    ...cropManager.region,
    x: Math.max(0, Math.min(cropManager.region.x, canvas.clientWidth - cropManager.region.width)),
    y: Math.max(0, Math.min(cropManager.region.y, canvas.clientHeight - cropManager.region.height)),
  };

  draw(cropManager.region);
}

function updateCursor(mouseX: number, mouseY: number) {
  const canvas = cropManager.cropAreaEl;
  if (!canvas) {
    return;
  }

  const crop = cropManager.region;
  const rotateDeg = cropManager.normalizedRotation;

  let {
    onLeftBoundary,
    onRightBoundary,
    onTopBoundary,
    onBottomBoundary,
    onTopLeftCorner,
    onTopRightCorner,
    onBottomLeftCorner,
    onBottomRightCorner,
  } = isOnCropBoundary(mouseX, mouseY, crop, cropManager.cropImageSize);

  if (rotateDeg == 90) {
    [onTopBoundary, onRightBoundary, onBottomBoundary, onLeftBoundary] = [
      onLeftBoundary,
      onTopBoundary,
      onRightBoundary,
      onBottomBoundary,
    ];

    [onTopLeftCorner, onTopRightCorner, onBottomRightCorner, onBottomLeftCorner] = [
      onBottomLeftCorner,
      onTopLeftCorner,
      onTopRightCorner,
      onBottomRightCorner,
    ];
  } else if (rotateDeg == 180) {
    [onTopBoundary, onBottomBoundary] = [onBottomBoundary, onTopBoundary];
    [onLeftBoundary, onRightBoundary] = [onRightBoundary, onLeftBoundary];

    [onTopLeftCorner, onBottomRightCorner] = [onBottomRightCorner, onTopLeftCorner];
    [onTopRightCorner, onBottomLeftCorner] = [onBottomLeftCorner, onTopRightCorner];
  } else if (rotateDeg == 270) {
    [onTopBoundary, onRightBoundary, onBottomBoundary, onLeftBoundary] = [
      onRightBoundary,
      onBottomBoundary,
      onLeftBoundary,
      onTopBoundary,
    ];

    [onTopLeftCorner, onTopRightCorner, onBottomRightCorner, onBottomLeftCorner] = [
      onTopRightCorner,
      onBottomRightCorner,
      onBottomLeftCorner,
      onTopLeftCorner,
    ];
  }
  if (onTopLeftCorner || onBottomRightCorner) {
    setCursor('nwse-resize');
  } else if (onTopRightCorner || onBottomLeftCorner) {
    setCursor('nesw-resize');
  } else if (onLeftBoundary || onRightBoundary) {
    setCursor('ew-resize');
  } else if (onTopBoundary || onBottomBoundary) {
    setCursor('ns-resize');
  } else if (isInCropArea(mouseX, mouseY, crop)) {
    setCursor('move');
  } else {
    setCursor('default');
  }

  function setCursor(cursorName: string) {
    if (cropManager.canvasCursor != cursorName && canvas && !editManager.isShowingConfirmDialog) {
      cropManager.canvasCursor = cursorName;
      document.body.style.cursor = cursorName;
      canvas.style.cursor = cursorName;
    }
  }
}

async function stopInteraction() {
  cropManager.isInteracting = false;
  cropManager.isDragging = false;
  cropManager.resizeSide = '';
  fadeOverlay(true); // Darken the background
}

function fadeOverlay(toDark: boolean) {
  const overlay = cropManager.overlayEl;
  const cropFrame = document.querySelector('.crop-frame');

  if (toDark) {
    overlay?.classList.remove('light');
    cropFrame?.classList.remove('resizing');
  } else {
    overlay?.classList.add('light');
    cropFrame?.classList.add('resizing');
  }

  cropManager.isInteracting = !toDark;
}
