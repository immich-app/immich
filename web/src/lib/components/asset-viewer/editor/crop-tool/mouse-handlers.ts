import {
  cropAspectRatio,
  cropImageScale,
  cropImageSize,
  cropSettings,
  cropSettingsChanged,
  normaizedRorateDegrees,
  rotateDegrees,
  showCancelConfirmDialog,
  type CropSettings,
} from '$lib/stores/asset-editor.store';
import { get } from 'svelte/store';
import { adjustDimensions, keepAspectRatio } from './crop-settings';
import {
  canvasCursor,
  cropAreaEl,
  dragOffset,
  isDragging,
  isResizingOrDragging,
  overlayEl,
  resizeSide,
} from './crop-store';
import { draw } from './drawing';

export function handleMouseDown(e: MouseEvent) {
  const canvas = get(cropAreaEl);
  if (!canvas) {
    return;
  }

  const crop = get(cropSettings);
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
  } = isOnCropBoundary(mouseX, mouseY, crop);

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
  window.addEventListener('mouseup', handleMouseUp);
}

export function handleMouseMove(e: MouseEvent) {
  const canvas = get(cropAreaEl);
  if (!canvas) {
    return;
  }

  const resizeSideValue = get(resizeSide);
  const { mouseX, mouseY } = getMousePosition(e);

  if (get(isDragging)) {
    moveCrop(mouseX, mouseY);
  } else if (resizeSideValue) {
    resizeCrop(mouseX, mouseY);
  } else {
    updateCursor(mouseX, mouseY);
  }
}

export function handleWheel(e: WheelEvent) {
  e.preventDefault;
  const canvas = get(cropAreaEl);
  if (!canvas) {
    return;
  }

  const wheelOffset = getWheelOffset(e);
  let scale = 1;

  if (wheelOffset > 0) {
    scale += wheelOffset * 0.1;
    scale = Math.min(Math.max(0.125, scale), 10);
  } else {
    scale = -1;
    scale += wheelOffset * 0.1;
    scale = Math.max(Math.min(-0.125, scale), -10);
  }

  scaleCrop(scale);
}

function getWheelOffset(e: WheelEvent) {
  return e.deltaY;
}

export function handleMouseUp() {
  window.removeEventListener('mouseup', handleMouseUp);
  document.body.style.userSelect = '';
  stopInteraction();
}

function getMousePosition(e: MouseEvent) {
  let offsetX = e.clientX;
  let offsetY = e.clientY;
  const clienRect = getBoundingClientRectCached(get(cropAreaEl));
  const rotateDeg = get(normaizedRorateDegrees);

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

type BoundingClientRect = ReturnType<HTMLElement['getBoundingClientRect']>;
let getBoundingClientRectCache: { data: BoundingClientRect | null; time: number } = {
  data: null,
  time: 0,
};
rotateDegrees.subscribe(() => {
  getBoundingClientRectCache.time = 0;
});
function getBoundingClientRectCached(el: HTMLElement | null) {
  if (Date.now() - getBoundingClientRectCache.time > 5000 || getBoundingClientRectCache.data === null) {
    getBoundingClientRectCache = {
      time: Date.now(),
      data: el?.getBoundingClientRect() ?? null,
    };
  }
  return getBoundingClientRectCache.data;
}

function isOnCropBoundary(mouseX: number, mouseY: number, crop: CropSettings) {
  const { x, y, width, height } = crop;
  const sensitivity = 10;
  const cornerSensitivity = 15;

  const outOfBound = mouseX > get(cropImageSize)[0] || mouseY > get(cropImageSize)[1] || mouseX < 0 || mouseY < 0;
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
  const crop = get(cropSettings);
  const {
    onLeftBoundary,
    onRightBoundary,
    onTopBoundary,
    onBottomBoundary,
    onTopLeftCorner,
    onTopRightCorner,
    onBottomLeftCorner,
    onBottomRightCorner,
  } = isOnCropBoundary(mouseX, mouseY, crop);

  if (onTopLeftCorner) {
    resizeSide.set('top-left');
  } else if (onTopRightCorner) {
    resizeSide.set('top-right');
  } else if (onBottomLeftCorner) {
    resizeSide.set('bottom-left');
  } else if (onBottomRightCorner) {
    resizeSide.set('bottom-right');
  } else if (onLeftBoundary) {
    resizeSide.set('left');
  } else if (onRightBoundary) {
    resizeSide.set('right');
  } else if (onTopBoundary) {
    resizeSide.set('top');
  } else if (onBottomBoundary) {
    resizeSide.set('bottom');
  }
}

function startDragging(mouseX: number, mouseY: number) {
  isDragging.set(true);
  const crop = get(cropSettings);
  isResizingOrDragging.set(true);
  dragOffset.set({ x: mouseX - crop.x, y: mouseY - crop.y });
  fadeOverlay(false);
}

function moveCrop(mouseX: number, mouseY: number) {
  const cropArea = get(cropAreaEl);
  if (!cropArea) {
    return;
  }

  const crop = get(cropSettings);
  const { x, y } = get(dragOffset);

  let newX = mouseX - x;
  let newY = mouseY - y;

  newX = Math.max(0, Math.min(cropArea.clientWidth - crop.width, newX));
  newY = Math.max(0, Math.min(cropArea.clientHeight - crop.height, newY));

  cropSettings.update((crop) => {
    crop.x = newX;
    crop.y = newY;
    return crop;
  });

  draw(crop);
}

function scaleCrop(scale: number) {
  const canvas = get(cropAreaEl);
  const crop = get(cropSettings);
  if (!canvas) {
    return;
  }

  const { x, y, width, height } = crop;
  const minSize = 50;
  fadeOverlay(false);

  cropSettings.update((crop) => {
    crop.width += scale;
    crop.height += scale;
    return crop;
  });
}

function resizeCrop(mouseX: number, mouseY: number) {
  const canvas = get(cropAreaEl);
  const crop = get(cropSettings);
  const resizeSideValue = get(resizeSide);
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
        const { newWidth: w, newHeight: h } = keepAspectRatio(newWidth, newHeight, get(cropAspectRatio));
        cropSettings.update((crop) => {
          crop.width = Math.max(minSize, Math.min(w, canvas.clientWidth));
          crop.height = Math.max(minSize, Math.min(h, canvas.clientHeight));
          crop.x = Math.max(0, x + width - crop.width);
          return crop;
        });
      }
      break;
    }
    case 'right': {
      newWidth = mouseX - x;
      newHeight = height;
      if (newWidth >= minSize && mouseX <= canvas.clientWidth) {
        const { newWidth: w, newHeight: h } = keepAspectRatio(newWidth, newHeight, get(cropAspectRatio));
        cropSettings.update((crop) => {
          crop.width = Math.max(minSize, Math.min(w, canvas.clientWidth - x));
          crop.height = Math.max(minSize, Math.min(h, canvas.clientHeight));
          return crop;
        });
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
          get(cropAspectRatio),
          canvas.clientWidth,
          canvas.clientHeight,
          minSize,
        );
        cropSettings.update((crop) => {
          crop.y = Math.max(0, y + height - h);
          crop.width = w;
          crop.height = h;
          return crop;
        });
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
          get(cropAspectRatio),
          canvas.clientWidth,
          canvas.clientHeight - y,
          minSize,
        );
        cropSettings.update((crop) => {
          crop.width = w;
          crop.height = h;
          return crop;
        });
      }
      break;
    }
    case 'top-left': {
      newWidth = width + x - Math.max(mouseX, 0);
      newHeight = height + y - Math.max(mouseY, 0);
      const { newWidth: w, newHeight: h } = adjustDimensions(
        newWidth,
        newHeight,
        get(cropAspectRatio),
        canvas.clientWidth,
        canvas.clientHeight,
        minSize,
      );
      cropSettings.update((crop) => {
        crop.width = w;
        crop.height = h;
        crop.x = Math.max(0, x + width - crop.width);
        crop.y = Math.max(0, y + height - crop.height);
        return crop;
      });
      break;
    }
    case 'top-right': {
      newWidth = Math.max(mouseX, 0) - x;
      newHeight = height + y - Math.max(mouseY, 0);
      const { newWidth: w, newHeight: h } = adjustDimensions(
        newWidth,
        newHeight,
        get(cropAspectRatio),
        canvas.clientWidth - x,
        y + height,
        minSize,
      );
      cropSettings.update((crop) => {
        crop.width = w;
        crop.height = h;
        crop.y = Math.max(0, y + height - crop.height);
        return crop;
      });
      break;
    }
    case 'bottom-left': {
      newWidth = width + x - Math.max(mouseX, 0);
      newHeight = Math.max(mouseY, 0) - y;
      const { newWidth: w, newHeight: h } = adjustDimensions(
        newWidth,
        newHeight,
        get(cropAspectRatio),
        canvas.clientWidth,
        canvas.clientHeight - y,
        minSize,
      );
      cropSettings.update((crop) => {
        crop.width = w;
        crop.height = h;
        crop.x = Math.max(0, x + width - crop.width);
        return crop;
      });
      break;
    }
    case 'bottom-right': {
      newWidth = Math.max(mouseX, 0) - x;
      newHeight = Math.max(mouseY, 0) - y;
      const { newWidth: w, newHeight: h } = adjustDimensions(
        newWidth,
        newHeight,
        get(cropAspectRatio),
        canvas.clientWidth - x,
        canvas.clientHeight - y,
        minSize,
      );
      cropSettings.update((crop) => {
        crop.width = w;
        crop.height = h;
        return crop;
      });
      break;
    }
  }

  cropSettings.update((crop) => {
    crop.x = Math.max(0, Math.min(crop.x, canvas.clientWidth - crop.width));
    crop.y = Math.max(0, Math.min(crop.y, canvas.clientHeight - crop.height));
    return crop;
  });

  draw(crop);
}

function updateCursor(mouseX: number, mouseY: number) {
  const canvas = get(cropAreaEl);
  if (!canvas) {
    return;
  }

  const crop = get(cropSettings);
  const rotateDeg = get(normaizedRorateDegrees);

  let {
    onLeftBoundary,
    onRightBoundary,
    onTopBoundary,
    onBottomBoundary,
    onTopLeftCorner,
    onTopRightCorner,
    onBottomLeftCorner,
    onBottomRightCorner,
  } = isOnCropBoundary(mouseX, mouseY, crop);

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
    if (get(canvasCursor) != cursorName && canvas && !get(showCancelConfirmDialog)) {
      canvasCursor.set(cursorName);
      document.body.style.cursor = cursorName;
      canvas.style.cursor = cursorName;
    }
  }
}

function stopInteraction() {
  isResizingOrDragging.set(false);
  isDragging.set(false);
  resizeSide.set('');
  fadeOverlay(true); // Darken the background

  setTimeout(() => {
    checkEdits();
  }, 1);
}

export function checkEdits() {
  const cropImageSizeParams = get(cropSettings);
  const originalImgSize = get(cropImageSize).map((el) => el * get(cropImageScale));
  const changed =
    Math.abs(originalImgSize[0] - cropImageSizeParams.width) > 2 ||
    Math.abs(originalImgSize[1] - cropImageSizeParams.height) > 2;
  cropSettingsChanged.set(changed);
}

function fadeOverlay(toDark: boolean) {
  const overlay = get(overlayEl);
  const cropFrame = document.querySelector('.crop-frame');

  if (toDark) {
    overlay?.classList.remove('light');
    cropFrame?.classList.remove('resizing');
  } else {
    overlay?.classList.add('light');
    cropFrame?.classList.add('resizing');
  }

  isResizingOrDragging.set(!toDark);
}
