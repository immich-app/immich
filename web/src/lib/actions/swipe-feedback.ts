export interface SwipeFeedbackOptions {
  /** Whether the swipe feedback is disabled */
  disabled?: boolean;
  /** Callback when swipe ends with the final offset */
  onSwipeEnd?: (offsetX: number) => void;
  /** Callback during swipe with current offset */
  onSwipeMove?: (offsetX: number) => void;
  /** URL for the preview image shown on the left when swiping right (previous) */
  leftPreviewUrl?: string | null;
  /** URL for the preview image shown on the right when swiping left (next) */
  rightPreviewUrl?: string | null;
  /** Callback called before swipe commit animation starts - includes direction and preview image dimensions */
  onPreCommit?: (direction: 'left' | 'right', naturalWidth: number, naturalHeight: number) => void;
  /** Callback when swipe is committed (threshold exceeded) after animation completes */
  onSwipeCommit?: (direction: 'left' | 'right') => void;
  /** Minimum number of pixels before activating swipe. (Default = 45) */
  swipeThreshold?: number;
  /** Current asset URL - when this changes, preview containers are reset */
  currentAssetUrl?: string | null;
  /** The img or video element to transform. If not provided, will query for img/video inside the node */
  imageElement?: HTMLImageElement | HTMLVideoElement | null;
}

/**
 * Action that provides visual feedback for horizontal swipe gestures.
 * Allows the user to drag an element left or right (horizontal only),
 * and resets the position when the drag ends.
 * Optionally shows preview images on the left/right during swipe.
 */
export const swipeFeedback = (node: HTMLElement, options?: SwipeFeedbackOptions) => {
  // Find the image element to apply custom transforms
  let imgElement: HTMLImageElement | HTMLVideoElement | null =
    options?.imageElement ?? node.querySelector('img') ?? node.querySelector('video');

  let isDragging = false;
  let startX = 0;
  let currentOffsetX = 0;

  let lastAssetUrl = options?.currentAssetUrl;
  let dragStartTime: Date | null = null;
  let swipeAmount = 0;

  // Set initial cursor
  node.style.cursor = 'grab';

  const resetPreviewContainers = () => {
    // Reset transforms and opacity
    if (leftPreviewContainer) {
      leftPreviewContainer.style.transform = '';
      leftPreviewContainer.style.transition = '';
      leftPreviewContainer.style.zIndex = '-1';
      leftPreviewContainer.style.display = 'none';
    }
    if (rightPreviewContainer) {
      rightPreviewContainer.style.transform = '';
      rightPreviewContainer.style.transition = '';
      rightPreviewContainer.style.zIndex = '-1';
      rightPreviewContainer.style.display = 'none';
    }
    // Reset main image
    if (imgElement) {
      imgElement.style.transform = '';
      imgElement.style.transition = '';
      imgElement.style.opacity = '';
    }
    currentOffsetX = 0;
  };

  // Create preview image containers
  let leftPreviewContainer: HTMLDivElement | null = null;
  let rightPreviewContainer: HTMLDivElement | null = null;
  let leftPreviewImg: HTMLImageElement | null = null;
  let rightPreviewImg: HTMLImageElement | null = null;

  const createPreviewContainer = (): { container: HTMLDivElement; img: HTMLImageElement } => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.pointerEvents = 'none';
    container.style.display = 'none';
    container.style.zIndex = '-1';

    const img = document.createElement('img');
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.draggable = false;
    img.alt = '';

    container.append(img);
    node.parentElement?.append(container);

    return { container, img };
  };

  const ensurePreviewsCreated = () => {
    // Create left preview if needed and URL is available
    if (options?.leftPreviewUrl && !leftPreviewContainer) {
      const preview = createPreviewContainer();
      leftPreviewContainer = preview.container;
      leftPreviewImg = preview.img;
      leftPreviewImg.src = options.leftPreviewUrl;
    }

    // Create right preview if needed and URL is available
    if (options?.rightPreviewUrl && !rightPreviewContainer) {
      const preview = createPreviewContainer();
      rightPreviewContainer = preview.container;
      rightPreviewImg = preview.img;
      rightPreviewImg.src = options.rightPreviewUrl;
    }
  };

  const updatePreviewPositions = () => {
    // Get the parent container dimensions (full viewport area)
    const parentElement = node.parentElement;
    if (!parentElement) {
      return;
    }

    const parentComputedStyle = globalThis.getComputedStyle(parentElement);
    const viewportWidth = Number.parseFloat(parentComputedStyle.width);
    const viewportHeight = Number.parseFloat(parentComputedStyle.height);

    // Preview containers should be full viewport size
    if (leftPreviewContainer) {
      leftPreviewContainer.style.width = `${viewportWidth}px`;
      leftPreviewContainer.style.height = `${viewportHeight}px`;
      leftPreviewContainer.style.left = `${-viewportWidth}px`;
      leftPreviewContainer.style.top = `0px`;
    }

    if (rightPreviewContainer) {
      rightPreviewContainer.style.width = `${viewportWidth}px`;
      rightPreviewContainer.style.height = `${viewportHeight}px`;
      rightPreviewContainer.style.left = `${viewportWidth}px`;
      rightPreviewContainer.style.top = `0px`;
    }
  };

  const updatePreviewVisibility = () => {
    // Show left preview when swiping right (offsetX > 0)
    if (leftPreviewContainer) {
      leftPreviewContainer.style.display = currentOffsetX > 0 ? 'block' : 'none';
    }

    // Show right preview when swiping left (offsetX < 0)
    if (rightPreviewContainer) {
      rightPreviewContainer.style.display = currentOffsetX < 0 ? 'block' : 'none';
    }
  };

  const pointerDown = (event: PointerEvent) => {
    if (options?.disabled || !imgElement) {
      return;
    }

    // Only handle single pointer (mouse or single touch)
    if (event.isPrimary) {
      isDragging = true;
      startX = event.clientX;

      // Change cursor to grabbing
      node.style.cursor = 'grabbing';
      // Capture pointer so we continue to receive events even if mouse moves outside element
      node.setPointerCapture(event.pointerId);
      dragStartTime = new Date();

      // Also add document listeners as fallback
      document.addEventListener('pointerup', pointerUp);
      document.addEventListener('pointercancel', pointerUp);
      ensurePreviewsCreated();
      updatePreviewPositions();
      event.preventDefault();
    }
  };

  const pointerMove = (event: PointerEvent) => {
    if (options?.disabled || !imgElement) {
      return;
    }

    if (isDragging) {
      currentOffsetX = event.clientX - startX;

      const xDelta = event.clientX - startX;
      swipeAmount = xDelta;

      // Apply transform directly to the image element
      // Only translate horizontally (no vertical movement)
      imgElement.style.transform = `translate(${currentOffsetX}px, 0px)`;

      // Apply same transform to preview containers so they move with the swipe
      if (leftPreviewContainer) {
        leftPreviewContainer.style.transform = `translate(${currentOffsetX}px, 0px)`;
      }
      if (rightPreviewContainer) {
        rightPreviewContainer.style.transform = `translate(${currentOffsetX}px, 0px)`;
      }

      // Update preview visibility
      updatePreviewVisibility();
      // Notify about swipe movement
      options?.onSwipeMove?.(currentOffsetX);
      event.preventDefault();
    }
  };

  const resetPosition = () => {
    if (!imgElement) {
      return;
    }

    // Add smooth transition
    const transitionStyle = 'transform 0.3s ease-out';
    imgElement.style.transition = transitionStyle;
    if (leftPreviewContainer) {
      leftPreviewContainer.style.transition = transitionStyle;
    }
    if (rightPreviewContainer) {
      rightPreviewContainer.style.transition = transitionStyle;
    }

    // Reset transforms
    imgElement.style.transform = 'translate(0px, 0px)';
    if (leftPreviewContainer) {
      leftPreviewContainer.style.transform = 'translate(0px, 0px)';
    }
    if (rightPreviewContainer) {
      rightPreviewContainer.style.transform = 'translate(0px, 0px)';
    }

    // Remove transition after animation completes
    setTimeout(() => {
      if (imgElement) {
        imgElement.style.transition = '';
      }
      if (leftPreviewContainer) {
        leftPreviewContainer.style.transition = '';
      }
      if (rightPreviewContainer) {
        rightPreviewContainer.style.transition = '';
      }
    }, 300);

    currentOffsetX = 0;
    updatePreviewVisibility();
  };

  const completeTransition = (direction: 'left' | 'right') => {
    if (!imgElement) {
      return;
    }

    // Get the active preview image and its dimensions
    const activePreviewImg = direction === 'right' ? leftPreviewImg : rightPreviewImg;
    const naturalWidth = activePreviewImg?.naturalWidth ?? 1;
    const naturalHeight = activePreviewImg?.naturalHeight ?? 1;
    console.log('nat', naturalWidth, naturalHeight);

    // Call pre-commit callback BEFORE starting the animation
    // This allows the parent component to update state with the preview dimensions
    options?.onPreCommit?.(direction, naturalWidth, naturalHeight);

    // Add smooth transition
    const transitionStyle = 'transform 0.3s ease-out';
    imgElement.style.transition = transitionStyle;
    if (leftPreviewContainer) {
      leftPreviewContainer.style.transition = transitionStyle;
    }
    if (rightPreviewContainer) {
      rightPreviewContainer.style.transition = transitionStyle;
    }

    // Calculate the final offset to center the preview
    const parentElement = node.parentElement;
    if (!parentElement) {
      return;
    }
    const viewportWidth = Number.parseFloat(globalThis.getComputedStyle(parentElement).width);

    // Slide everything to complete the transition
    // If swiping right (direction='right'), slide everything right by viewport width
    // If swiping left (direction='left'), slide everything left by viewport width
    const finalOffset = direction === 'right' ? viewportWidth : -viewportWidth;

    // Listen for transition end
    const handleTransitionEnd = () => {
      if (!imgElement) {
        return;
      }

      imgElement.removeEventListener('transitionend', handleTransitionEnd);

      // Keep the preview visible by hiding the main image but showing the preview
      // The preview is now centered, and we want it to stay visible while the new component loads
      imgElement.style.opacity = '0';

      // Show the preview that's now in the center
      const activePreview = direction === 'right' ? leftPreviewContainer : rightPreviewContainer;

      if (activePreview) {
        activePreview.style.zIndex = '1'; // Bring to front
      }

      // Remove transitions
      imgElement.style.transition = '';
      if (leftPreviewContainer) {
        leftPreviewContainer.style.transition = '';
      }
      if (rightPreviewContainer) {
        rightPreviewContainer.style.transition = '';
      }

      // Trigger navigation (dimensions were already passed in onPreCommit)
      options?.onSwipeCommit?.(direction);
    };

    imgElement.addEventListener('transitionend', handleTransitionEnd, { once: true });

    // Apply the final transform to trigger animation
    imgElement.style.transform = `translate(${finalOffset}px, 0px)`;
    if (leftPreviewContainer) {
      leftPreviewContainer.style.transform = `translate(${finalOffset}px, 0px)`;
    }
    if (rightPreviewContainer) {
      rightPreviewContainer.style.transform = `translate(${finalOffset}px, 0px)`;
    }
  };

  const pointerUp = (event: PointerEvent) => {
    if (isDragging) {
      if (!imgElement) {
        return;
      }
      isDragging = false;
      // Reset cursor
      node.style.cursor = 'grab';
      // Release pointer capture
      if (node.hasPointerCapture(event.pointerId)) {
        node.releasePointerCapture(event.pointerId);
      }
      // Remove document listeners
      document.removeEventListener('pointerup', pointerUp);
      document.removeEventListener('pointercancel', pointerUp);

      const threshold = options?.swipeThreshold ?? 45;

      const timeTaken = Date.now() - (dragStartTime?.getTime() ?? 0);

      const velocity = Math.abs(swipeAmount) / timeTaken;
      console.log('velocity', velocity, swipeAmount);
      if (Math.abs(swipeAmount) < threshold || velocity < 0.11) {
        resetPosition();
        return;
      }

      // Check if swipe exceeded threshold

      const commitDirection = currentOffsetX > 0 ? 'right' : 'left';

      // Call onSwipeEnd callback
      options?.onSwipeEnd?.(currentOffsetX);

      // complete the transition animation
      completeTransition(commitDirection);
    }
  };

  // Add event listeners
  node.addEventListener('pointerdown', pointerDown);
  node.addEventListener('pointermove', pointerMove);
  node.addEventListener('pointerup', pointerUp);
  node.addEventListener('pointercancel', pointerUp);

  return {
    update(newOptions?: SwipeFeedbackOptions) {
      // Update imgElement if provided
      if (newOptions?.imageElement !== undefined) {
        imgElement = newOptions.imageElement;
      }

      // Check if asset URL changed - if so, reset everything
      if (newOptions?.currentAssetUrl && newOptions.currentAssetUrl !== lastAssetUrl) {
        resetPreviewContainers();
        lastAssetUrl = newOptions.currentAssetUrl;
      }

      options = newOptions;

      // Update or create left preview
      if (options?.leftPreviewUrl) {
        if (leftPreviewImg) {
          // Update existing
          leftPreviewImg.src = options.leftPreviewUrl;
        } else if (!leftPreviewContainer) {
          // Create if doesn't exist
          const preview = createPreviewContainer();
          leftPreviewContainer = preview.container;
          leftPreviewImg = preview.img;
          leftPreviewImg.src = options.leftPreviewUrl;
        }
      }

      // Update or create right preview
      if (options?.rightPreviewUrl) {
        if (rightPreviewImg) {
          // Update existing
          rightPreviewImg.src = options.rightPreviewUrl;
        } else if (!rightPreviewContainer) {
          // Create if doesn't exist
          const preview = createPreviewContainer();
          rightPreviewContainer = preview.container;
          rightPreviewImg = preview.img;
          rightPreviewImg.src = options.rightPreviewUrl;
        }
      }
    },
    destroy() {
      node.removeEventListener('pointerdown', pointerDown);
      node.removeEventListener('pointermove', pointerMove);
      node.removeEventListener('pointerup', pointerUp);
      node.removeEventListener('pointercancel', pointerUp);
      // Clean up document listeners in case they weren't removed
      document.removeEventListener('pointerup', pointerUp);
      document.removeEventListener('pointercancel', pointerUp);
      // Clean up preview elements
      leftPreviewContainer?.remove();
      rightPreviewContainer?.remove();
      // Reset cursor
      node.style.cursor = '';
    },
  };
};
