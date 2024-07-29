<script lang="ts">
  import {
    cropAspectRatio,
    cropImageScale,
    cropImageSize,
    cropSettings,
    type CropSettings,
    type CropAspectRatio,
    cropSettingsChanged,
  } from '$lib/stores/asset-editor.store';
  import { getAssetOriginalUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { onMount, afterUpdate } from 'svelte';
  import { t } from 'svelte-i18n';

  export let crop = $cropSettings;
  export let asset;
  export let aspectRatio = $cropAspectRatio;
  cropSettings.subscribe((value) => {
    crop = value;
  });

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let img: HTMLImageElement;

  let darkenLevel = 0.65; // Initial darkening level
  let animationFrame: ReturnType<typeof requestAnimationFrame>;
  let canvasCursor: string;
  let isResizingOrDragging = false;

  const draw = () => {
    if (!ctx || !canvas) {
      return;
    }
    $cropSettings = crop;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    drawOverlay();
    drawCropRect();
  };

  cropAspectRatio.subscribe((value) => {
    aspectRatio = value;
    const newCrop = recalculateCrop(true); // Recalculate the crop when the aspect ratio changes and return the new value
    if (newCrop) {
      animateCropChange(newCrop);
    }
  });

  const drawCropRect = () => {
    ctx.globalCompositeOperation = 'exclusion';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);

    // Set blend mode
    if (isResizingOrDragging) {
      ctx.strokeStyle = isResizingOrDragging ? 'white' : 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;

      // Vertical lines
      const thirdWidth = crop.width / 3;
      ctx.beginPath();
      ctx.moveTo(crop.x + thirdWidth, crop.y);
      ctx.lineTo(crop.x + thirdWidth, crop.y + crop.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(crop.x + 2 * thirdWidth, crop.y);
      ctx.lineTo(crop.x + 2 * thirdWidth, crop.y + crop.height);
      ctx.stroke();

      // Horizontal lines
      const thirdHeight = crop.height / 3;
      ctx.beginPath();
      ctx.moveTo(crop.x, crop.y + thirdHeight);
      ctx.lineTo(crop.x + crop.width, crop.y + thirdHeight);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(crop.x, crop.y + 2 * thirdHeight);
      ctx.lineTo(crop.x + crop.width, crop.y + 2 * thirdHeight);
      ctx.stroke();
    }

    // Draw circles on corners
    ctx.globalCompositeOperation = 'source-over';
    const radius = 5; // Radius of the corner circles
    ctx.fillStyle = 'white';

    // Top-left corner
    ctx.beginPath();
    ctx.arc(crop.x, crop.y, radius, 0, 2 * Math.PI);
    ctx.fill();

    // Top-right corner
    ctx.beginPath();
    ctx.arc(crop.x + crop.width, crop.y, radius, 0, 2 * Math.PI);
    ctx.fill();

    // Bottom-left corner
    ctx.beginPath();
    ctx.arc(crop.x, crop.y + crop.height, radius, 0, 2 * Math.PI);
    ctx.fill();

    // Bottom-right corner
    ctx.beginPath();
    ctx.arc(crop.x + crop.width, crop.y + crop.height, radius, 0, 2 * Math.PI);
    ctx.fill();
  };

  const drawOverlay = () => {
    ctx.fillStyle = `rgba(0, 0, 0, ${darkenLevel})`;

    // Top
    ctx.fillRect(0, 0, canvas.width, crop.y);
    // Left
    ctx.fillRect(0, crop.y, crop.x, crop.height);
    // Right
    ctx.fillRect(crop.x + crop.width, crop.y, canvas.width - crop.x - crop.width, crop.height);
    // Bottom
    ctx.fillRect(0, crop.y + crop.height, canvas.width, canvas.height - crop.y - crop.height);
  };

  const fadeOverlay = (toDark: boolean) => {
    const step = toDark ? 0.05 : -0.05;
    const minDarkness = 0.4;
    const maxDarkness = 0.65;

    isResizingOrDragging = !toDark;

    const animate = () => {
      darkenLevel = Math.min(maxDarkness, Math.max(minDarkness, darkenLevel + step));
      draw();

      if ((toDark && darkenLevel < maxDarkness) || (!toDark && darkenLevel > minDarkness)) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(animationFrame);
      }
    };

    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(animate);
  };

  const resizeCanvas = () => {
    if (!canvas.parentElement) {
      return;
    }
    const containerWidth = canvas.parentElement.clientWidth;
    const containerHeight = canvas.parentElement.clientHeight;
    const imageAspectRatio = img.width / img.height;

    let scale;

    if (imageAspectRatio > 1) {
      // Horizontal image
      scale = containerWidth / img.width;
      if (img.height * scale > containerHeight) {
        scale = containerHeight / img.height;
      }
    } else {
      // Vertical or square image
      scale = containerHeight / img.height;
      if (img.width * scale > containerWidth) {
        scale = containerWidth / img.width;
      }
    }

    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    draw();
  };

  const onImageLoad = () => {
    if (canvas) {
      let newctx = canvas.getContext('2d');
      if (!newctx) {
        return;
      }
      ctx = newctx;
      resizeCanvas();

      const canvasParent = canvas.parentElement;
      if (!canvasParent) {
        return;
      }
      const containerWidth = canvasParent.clientWidth;
      const containerHeight = canvasParent.clientHeight;
      const imageAspectRatio = img.width / img.height;

      let scale;

      if (imageAspectRatio > 1) {
        // horizontal image
        scale = containerWidth / img.width;
        if (img.height * scale > containerHeight) {
          scale = containerHeight / img.height;
        }
      } else {
        // vertical image
        scale = containerHeight / img.height;
        if (img.width * scale > containerWidth) {
          scale = containerWidth / img.width;
        }
      }

      $cropImageSize = [img.width, img.height];
      $cropImageScale = scale;

      crop = { x: 0, y: 0, width: img.width * scale - 1, height: img.height * scale - 1 };

      draw();
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
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
    } = isOnCropBoundary(mouseX, mouseY);

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
    } else if (isInCropArea(mouseX, mouseY)) {
      startDragging(mouseX, mouseY);
    }
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const { mouseX, mouseY } = getMousePosition(e);

    if (isDragging) {
      moveCrop(mouseX, mouseY);
    } else if (resizeSide) {
      resizeCrop(mouseX, mouseY);
    } else {
      updateCursor(mouseX, mouseY);
    }
  };

  const handleMouseUp = () => {
    stopInteraction();
  };

  const handleMouseOut = () => {
    stopInteraction();
    window.removeEventListener('mouseup', handleMouseUp);
  };

  const getMousePosition = (e: MouseEvent) => {
    return { mouseX: e.offsetX, mouseY: e.offsetY };
  };

  const isOnCropBoundary = (mouseX: number, mouseY: number) => {
    const { x, y, width, height } = crop;
    const sensitivity = 10;
    const cornerSensitivity = 15;

    const onLeftBoundary =
      mouseX >= x - sensitivity && mouseX <= x + sensitivity && mouseY >= y && mouseY <= y + height;
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
  };

  const isInCropArea = (mouseX: number, mouseY: number) => {
    const { x, y, width, height } = crop;
    return mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height;
  };

  const setResizeSide = (mouseX: number, mouseY: number) => {
    const {
      onLeftBoundary,
      onRightBoundary,
      onTopBoundary,
      onBottomBoundary,
      onTopLeftCorner,
      onTopRightCorner,
      onBottomLeftCorner,
      onBottomRightCorner,
    } = isOnCropBoundary(mouseX, mouseY);

    if (onTopLeftCorner) {
      resizeSide = 'top-left';
    } else if (onTopRightCorner) {
      resizeSide = 'top-right';
    } else if (onBottomLeftCorner) {
      resizeSide = 'bottom-left';
    } else if (onBottomRightCorner) {
      resizeSide = 'bottom-right';
    } else if (onLeftBoundary) {
      resizeSide = 'left';
    } else if (onRightBoundary) {
      resizeSide = 'right';
    } else if (onTopBoundary) {
      resizeSide = 'top';
    } else if (onBottomBoundary) {
      resizeSide = 'bottom';
    }
  };

  const startDragging = (mouseX: number, mouseY: number) => {
    isDragging = true;
    dragOffset.x = mouseX - crop.x;
    dragOffset.y = mouseY - crop.y;
    fadeOverlay(false); // Lighten the background
  };

  const moveCrop = (mouseX: number, mouseY: number) => {
    let newX = mouseX - dragOffset.x;
    let newY = mouseY - dragOffset.y;

    // Ensure the rectangle stays within the canvas
    newX = Math.max(0, Math.min(canvas.width - crop.width, newX));
    newY = Math.max(0, Math.min(canvas.height - crop.height, newY));

    crop.x = newX;
    crop.y = newY;
    draw();
  };

  function keepAspectRatio(newWidth: number, newHeight: number, aspectRatio: CropAspectRatio) {
    switch (aspectRatio) {
      case '1:1': {
        return { newWidth: newHeight, newHeight };
      }
      case '16:9': {
        return { newWidth: (newHeight * 16) / 9, newHeight };
      }
      case '3:2': {
        return { newWidth: (newHeight * 3) / 2, newHeight };
      }
      case '7:5': {
        return { newWidth: (newHeight * 7) / 5, newHeight };
      }
      default: {
        return { newWidth, newHeight };
      }
    }
  }

  /**Adjusts the dimensions of the crop area while maintaining the specified aspect ratio.
   * This function takes the proposed new width and height of the crop area and ensures
   * that the aspect ratio is maintained. If the proposed dimensions exceed the provided
   * limits (xLimit and yLimit), the dimensions are adjusted to fit within these limits
   * while still maintaining the aspect ratio.
   */
  function adjustDimensions(
    newWidth: number,
    newHeight: number,
    aspectRatio: CropAspectRatio,
    xLimit: number,
    yLimit: number,
  ) {
    let w = newWidth,
      h = newHeight;

    let aspectMultiplier;
    switch (aspectRatio) {
      case '1:1': {
        aspectMultiplier = 1;
        break;
      }
      case '16:9': {
        aspectMultiplier = 16 / 9;
        break;
      }
      case '3:2': {
        aspectMultiplier = 3 / 2;
        break;
      }
      case '7:5': {
        aspectMultiplier = 7 / 5;
        break;
      }
      default: {
        aspectMultiplier = newWidth / newHeight;
      }
    }

    if (aspectRatio !== 'free') {
      h = w / aspectMultiplier;
    }

    if (w > xLimit) {
      w = xLimit;
      h = w / aspectMultiplier;
    }

    if (h > yLimit) {
      h = yLimit;
      w = h * aspectMultiplier;
    }

    return { newWidth: w, newHeight: h };
  }

  function resizeCrop(mouseX: number, mouseY: number) {
    if (!canvas) {
      return;
    }
    fadeOverlay(false);

    const { x, y, width, height } = crop;
    const minSize = 10;
    let newWidth, newHeight;

    switch (resizeSide) {
      case 'left': {
        newWidth = width + x - mouseX;
        newHeight = height;
        if (newWidth >= minSize && mouseX >= 0) {
          const { newWidth: w, newHeight: h } = keepAspectRatio(newWidth, newHeight, aspectRatio);
          crop.width = Math.min(w, canvas.width);
          crop.height = Math.min(h, canvas.height);
          crop.x = Math.max(0, x + width - crop.width);
        }
        break;
      }
      case 'right': {
        newWidth = mouseX - x;
        newHeight = height;
        if (newWidth >= minSize && mouseX <= canvas.width) {
          const { newWidth: w, newHeight: h } = keepAspectRatio(newWidth, newHeight, aspectRatio);
          crop.width = Math.min(w, canvas.width - x);
          crop.height = Math.min(h, canvas.height);
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
            aspectRatio,
            canvas.width,
            canvas.height,
          );
          crop.y = Math.max(0, y + height - h);

          crop.width = w;
          crop.height = h;
        }
        break;
      }
      case 'bottom': {
        newHeight = mouseY - y;
        newWidth = width;
        if (newHeight >= minSize && mouseY <= canvas.height) {
          const { newWidth: w, newHeight: h } = adjustDimensions(
            newWidth,
            newHeight,
            aspectRatio,
            canvas.width,
            canvas.height - y,
          );
          crop.width = w;
          crop.height = h;
        }
        break;
      }
      case 'top-left': {
        newWidth = width + x - mouseX;
        newHeight = height + y - mouseY;
        if (newWidth >= minSize && newHeight >= minSize && mouseX >= 0 && mouseY >= 0) {
          const { newWidth: w, newHeight: h } = adjustDimensions(
            newWidth,
            newHeight,
            aspectRatio,
            canvas.width,
            canvas.height,
          );
          crop.width = w;
          crop.height = h;
          crop.x = Math.max(0, x + width - crop.width);
          crop.y = Math.max(0, y + height - crop.height);
        }
        break;
      }
      case 'top-right': {
        newWidth = mouseX - x;
        newHeight = height + y - mouseY;
        if (newWidth >= minSize && newHeight >= minSize && mouseX <= canvas.width && mouseY >= 0) {
          const { newWidth: w, newHeight: h } = adjustDimensions(
            newWidth,
            newHeight,
            aspectRatio,
            canvas.width - x,
            y + height,
          );
          crop.width = w;
          crop.height = h;
          crop.y = y + height - h;
        }
        break;
      }
      case 'bottom-left': {
        newWidth = width + x - mouseX;
        newHeight = mouseY - y;
        if (newWidth >= minSize && newHeight >= minSize && mouseX >= 0 && mouseY <= canvas.height) {
          const { newWidth: w, newHeight: h } = adjustDimensions(
            newWidth,
            newHeight,
            aspectRatio,
            canvas.width,
            canvas.height - y,
          );
          crop.width = w;
          crop.height = h;
          crop.x = Math.max(0, x + width - crop.width);
        }
        break;
      }
      case 'bottom-right': {
        newWidth = mouseX - x;
        newHeight = mouseY - y;
        if (newWidth >= minSize && newHeight >= minSize && mouseX <= canvas.width && mouseY <= canvas.height) {
          const { newWidth: w, newHeight: h } = adjustDimensions(
            newWidth,
            newHeight,
            aspectRatio,
            canvas.width - x,
            canvas.height - y,
          );
          crop.width = w;
          crop.height = h;
        }
        break;
      }
    }

    // Ensure the crop does not go outside the canvas
    crop.x = Math.max(0, Math.min(crop.x, canvas.width - crop.width));
    crop.y = Math.max(0, Math.min(crop.y, canvas.height - crop.height));

    draw();
  }

  function recalculateCrop(returnNewCrop = false) {
    if (!canvas) {
      return null;
    }
    const { width, height, x, y } = crop;
    let newWidth = width;
    let newHeight = height;

    const { newWidth: w, newHeight: h } = keepAspectRatio(newWidth, newHeight, aspectRatio);

    // Ensure the crop stays within the canvas
    if (w > canvas.width) {
      newWidth = canvas.width;
      newHeight = canvas.width / (w / h);
    } else if (h > canvas.height) {
      newHeight = canvas.height;
      newWidth = canvas.height * (w / h);
    } else {
      newWidth = w;
      newHeight = h;
    }
    newWidth -= 1;
    newHeight -= 1;

    const newCrop = {
      width: newWidth,
      height: newHeight,
      x: Math.max(0, x + (width - newWidth) / 2),
      y: Math.max(0, y + (height - newHeight) / 2),
    };

    // Ensure the crop does not go outside the canvas
    if (newCrop.x + newWidth > canvas.width) {
      newCrop.x = canvas.width - newWidth;
    }
    if (newCrop.y + newHeight > canvas.height) {
      newCrop.y = canvas.height - newHeight;
    }

    if (returnNewCrop) {
      return newCrop;
    } else {
      crop.width = newWidth;
      crop.height = newHeight;
      crop.x = newCrop.x;
      crop.y = newCrop.y;
      draw();
      return null;
    }
  }

  function animateCropChange(newCrop: CropSettings, duration = 100) {
    if (!newCrop) {
      return;
    } // Check for undefined
    const startTime = performance.now();
    const initialCrop = { ...crop };

    const animate = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      crop.x = initialCrop.x + (newCrop.x - initialCrop.x) * progress;
      crop.y = initialCrop.y + (newCrop.y - initialCrop.y) * progress;
      crop.width = initialCrop.width + (newCrop.width - initialCrop.width) * progress;
      crop.height = initialCrop.height + (newCrop.height - initialCrop.height) * progress;

      draw();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  const updateCursor = (mouseX: number, mouseY: number) => {
    const {
      onLeftBoundary,
      onRightBoundary,
      onTopBoundary,
      onBottomBoundary,
      onTopLeftCorner,
      onTopRightCorner,
      onBottomLeftCorner,
      onBottomRightCorner,
    } = isOnCropBoundary(mouseX, mouseY);
    if (onTopLeftCorner || onBottomRightCorner) {
      setCursor('nwse-resize');
    } else if (onTopRightCorner || onBottomLeftCorner) {
      setCursor('nesw-resize');
    } else if (onLeftBoundary || onRightBoundary) {
      setCursor('ew-resize');
    } else if (onTopBoundary || onBottomBoundary) {
      setCursor('ns-resize');
    } else if (isInCropArea(mouseX, mouseY)) {
      setCursor('move');
    } else {
      setCursor('default');
    }

    function setCursor(cursorName: string) {
      if (canvasCursor != cursorName) {
        canvasCursor = cursorName;
        canvas.style.cursor = canvasCursor;
      }
    }
  };

  const stopInteraction = () => {
    isDragging = false;
    resizeSide = '';
    fadeOverlay(true); // Darken the background

    setTimeout(() => {
      let cropImageSizeParams = $cropSettings;
      let originalImgSize = $cropImageSize.map((el) => el * $cropImageScale);
      let changed =
        Math.abs(originalImgSize[0] - cropImageSizeParams.width) > 2 &&
        Math.abs(originalImgSize[1] - cropImageSizeParams.height) > 2;
      $cropSettingsChanged = changed;
    }, 1);
  };

  onMount(() => {
    img = new Image();
    img.src = getAssetOriginalUrl({ id: asset.id, checksum: asset.checksum })

    img.addEventListener('load', onImageLoad);
    img.addEventListener('error', (error) => {
      handleError(error, $t('error_loading_image'));
    });
  });

  afterUpdate(() => {
    resizeCanvas();
  });

  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  let resizeSide = '';
</script>

<div class="canvas-container">
  <canvas
    bind:this={canvas}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:blur={handleMouseOut}
  ></canvas>
</div>

<style>
  .canvas-container {
    width: 90%;
    margin: auto;
    margin-top: 4rem;
    height: calc(100% - 6rem);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  canvas {
    cursor: default;
  }
</style>
