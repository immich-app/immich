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

interface SwipeAnimations {
  currentImageAnimation: Animation;
  previewAnimation: Animation | null;
}

/**
 * Action that provides visual feedback for horizontal swipe gestures.
 * Allows the user to drag an element left or right (horizontal only),
 * and resets the position when the drag ends.
 * Optionally shows preview images on the left/right during swipe.
 */
export const swipeFeedback = (node: HTMLElement, options?: SwipeFeedbackOptions) => {
  // Animation configuration
  const ANIMATION_DURATION_MS = 300;
  // Enable/disable scaling effect during animation
  const ENABLE_SCALE_ANIMATION = false;

  // Find the image element to apply custom transforms
  let imgElement: HTMLImageElement | HTMLVideoElement | null =
    options?.imageElement ?? node.querySelector('img') ?? node.querySelector('video');

  let isDragging = false;
  let startX = 0;
  let currentOffsetX = 0;

  let lastAssetUrl = options?.currentAssetUrl;
  let dragStartTime: Date | null = null;
  let swipeAmount = 0;

  // Web Animations API - bidirectional animations
  let leftAnimations: SwipeAnimations | null = null;
  let rightAnimations: SwipeAnimations | null = null;

  // Set initial cursor
  node.style.cursor = 'grab';

  const resetPreviewContainers = () => {
    // Cancel any active animations
    leftAnimations?.currentImageAnimation?.cancel();
    leftAnimations?.previewAnimation?.cancel();
    rightAnimations?.currentImageAnimation?.cancel();
    rightAnimations?.previewAnimation?.cancel();
    leftAnimations = null;
    rightAnimations = null;

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

  /**
   * Creates Web Animations API animations for swipe transitions.
   * Matches the keyframes from Month.svelte view transitions.
   * @param direction - 'left' for next (swipe left), 'right' for previous (swipe right)
   */
  const createSwipeAnimations = (direction: 'left' | 'right'): SwipeAnimations | null => {
    if (!imgElement) {
      return null;
    }

    const duration = ANIMATION_DURATION_MS;
    const easing = 'linear'; // Linear easing to match drag rate

    // Set transform origin to center for proper scaling
    imgElement.style.transformOrigin = 'center';

    // Helper to build transform string with optional scale
    const scale = (s: number) => (ENABLE_SCALE_ANIMATION ? ` scale(${s})` : '');

    // Animation for current image flying out
    // Note: Delayed opacity fade (stays at 1 until 20%, fades 20-80%) for tighter crossfade
    const currentImageAnimation = imgElement.animate(
      direction === 'left'
        ? [
            // flyOutLeft - Month.svelte:280-289
            { transform: `translateX(0)${scale(1)}`, opacity: '1', offset: 0 },
            { transform: `translateX(-100vw)${scale(0)}`, opacity: '0', offset: 1 },
          ]
        : [
            // flyOutRight - Month.svelte:303-312
            { transform: `translateX(0)${scale(1)}`, opacity: '1', offset: 0 },
            { transform: `translateX(100vw)${scale(0)}`, opacity: '0', offset: 1 },
          ],
      {
        duration,
        easing,
        fill: 'both',
      },
    );

    // Animation for preview image flying in
    const previewContainer = direction === 'left' ? rightPreviewContainer : leftPreviewContainer;
    let previewAnimation: Animation | null = null;

    if (previewContainer) {
      // Set transform origin to center for proper scaling
      previewContainer.style.transformOrigin = 'center';

      previewAnimation = previewContainer.animate(
        direction === 'left'
          ? [
              // flyInRight - Month.svelte:291-300
              // Note: Early opacity fade (starts at 0, fades 20-80%, stays at 1 after 80%)
              { transform: `translateX(100vw)${scale(0)}`, opacity: '0', offset: 0 },
              { transform: `translateX(80vw)${scale(0.2)}`, opacity: '0', offset: 0.2 },
              { transform: `translateX(50vw)${scale(0.5)}`, opacity: '0.5', offset: 0.5 },
              { transform: `translateX(20vw)${scale(0.8)}`, opacity: '1', offset: 0.8 },
              { transform: `translateX(0)${scale(1)}`, opacity: '1', offset: 1 },
            ]
          : [
              // flyInLeft - Month.svelte:269-278
              { transform: `translateX(-100vw)${scale(0)}`, opacity: '0', offset: 0 },
              { transform: `translateX(-80vw)${scale(0.2)}`, opacity: '0', offset: 0.2 },
              { transform: `translateX(-50vw)${scale(0.5)}`, opacity: '0.5', offset: 0.5 },
              { transform: `translateX(-20vw)${scale(0.8)}`, opacity: '1', offset: 0.8 },
              { transform: `translateX(0)${scale(1)}`, opacity: '1', offset: 1 },
            ],
        {
          duration,
          easing,
          fill: 'both',
        },
      );
    }

    // Pause both animations immediately - we'll control them manually via currentTime
    currentImageAnimation.pause();
    previewAnimation?.pause();

    return { currentImageAnimation, previewAnimation };
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

    // Preview containers should be full viewport size, positioned at 0,0
    // The animations will handle the translateX positioning
    if (leftPreviewContainer) {
      leftPreviewContainer.style.width = `${viewportWidth}px`;
      leftPreviewContainer.style.height = `${viewportHeight}px`;
      leftPreviewContainer.style.left = `0px`;
      leftPreviewContainer.style.top = `0px`;
    }

    if (rightPreviewContainer) {
      rightPreviewContainer.style.width = `${viewportWidth}px`;
      rightPreviewContainer.style.height = `${viewportHeight}px`;
      rightPreviewContainer.style.left = `0px`;
      rightPreviewContainer.style.top = `0px`;
    }
  };

  /**
   * Calculates animation progress (0-1) based on drag distance.
   * Maps pixel drag distance to viewport width to match the animation's vw-based transforms.
   * @param dragPixels - Absolute drag distance in pixels
   * @returns Progress value between 0 and 1
   */
  const calculateAnimationProgress = (dragPixels: number): number => {
    // The animation moves from 0 to 100vw, so map pixel drag to viewport width
    const viewportWidth = window.innerWidth;
    const dragInViewportUnits = dragPixels / viewportWidth;
    return Math.min(dragInViewportUnits, 1);
  };

  const pointerDown = (event: PointerEvent) => {
    if (options?.disabled || !imgElement) {
      return;
    }

    // Only handle primary mouse button (0) and single touch (isPrimary)
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }

    isDragging = true;
    startX = event.clientX;
    swipeAmount = 0;

    // Change cursor to grabbing
    node.style.cursor = 'grabbing';
    // Capture pointer so we continue to receive events even if mouse moves outside element
    node.setPointerCapture(event.pointerId);
    dragStartTime = new Date();

    // Also add document listeners as fallback
    document.addEventListener('pointerup', pointerUp);
    document.addEventListener('pointercancel', pointerUp);

    // Ensure preview containers are created and positioned
    ensurePreviewsCreated();
    updatePreviewPositions();

    // Note: We don't create animations here - they're lazy-created in pointerMove
    // when we know which direction the user is swiping

    event.preventDefault();
  };

  const pointerMove = (event: PointerEvent) => {
    if (options?.disabled || !imgElement || !isDragging) {
      return;
    }

    currentOffsetX = event.clientX - startX;
    swipeAmount = currentOffsetX;

    // Determine which direction we're swiping
    const isSwipingLeft = currentOffsetX < 0;
    const isSwipingRight = currentOffsetX > 0;

    // Lazy create animations when first needed
    if (isSwipingLeft && !leftAnimations) {
      leftAnimations = createSwipeAnimations('left');
      // Ensure the right preview container is visible
      if (rightPreviewContainer) {
        rightPreviewContainer.style.display = 'block';
        rightPreviewContainer.style.zIndex = '1';
      }
    } else if (isSwipingRight && !rightAnimations) {
      rightAnimations = createSwipeAnimations('right');
      // Ensure the left preview container is visible
      if (leftPreviewContainer) {
        leftPreviewContainer.style.display = 'block';
        leftPreviewContainer.style.zIndex = '1';
      }
    }

    // Calculate animation progress based on drag distance
    const progress = calculateAnimationProgress(Math.abs(currentOffsetX));
    const animationTime = progress * ANIMATION_DURATION_MS;

    if (isSwipingLeft && leftAnimations) {
      // Ensure the right preview container is visible
      if (rightPreviewContainer) {
        rightPreviewContainer.style.display = 'block';
        rightPreviewContainer.style.zIndex = '1';
      }
      // Scrub left animations forward
      leftAnimations.currentImageAnimation.currentTime = animationTime;
      if (leftAnimations.previewAnimation) {
        leftAnimations.previewAnimation.currentTime = animationTime;
      }
      // Cancel and recreate right animations to prevent conflicts on imgElement
      if (rightAnimations) {
        rightAnimations.currentImageAnimation.cancel();
        if (rightAnimations.previewAnimation) {
          rightAnimations.previewAnimation.cancel();
        }
        rightAnimations = null;
        if (leftPreviewContainer) {
          leftPreviewContainer.style.display = 'none';
        }
      }
    } else if (isSwipingRight && rightAnimations) {
      // Ensure the left preview container is visible
      if (leftPreviewContainer) {
        leftPreviewContainer.style.display = 'block';
        leftPreviewContainer.style.zIndex = '1';
      }
      // Scrub right animations forward
      rightAnimations.currentImageAnimation.currentTime = animationTime;
      if (rightAnimations.previewAnimation) {
        rightAnimations.previewAnimation.currentTime = animationTime;
      }
      // Cancel and recreate left animations to prevent conflicts on imgElement
      if (leftAnimations) {
        leftAnimations.currentImageAnimation.cancel();
        if (leftAnimations.previewAnimation) {
          leftAnimations.previewAnimation.cancel();
        }
        leftAnimations = null;
        if (rightPreviewContainer) {
          rightPreviewContainer.style.display = 'none';
        }
      }
    }
    // Notify about swipe movement
    options?.onSwipeMove?.(currentOffsetX);
    event.preventDefault();
  };

  const resetPosition = () => {
    if (!imgElement) {
      return;
    }

    // Determine which animations are active
    const activeAnimations = currentOffsetX < 0 ? leftAnimations : rightAnimations;
    const activePreviewContainer = currentOffsetX < 0 ? rightPreviewContainer : leftPreviewContainer;

    if (!activeAnimations) {
      currentOffsetX = 0;
      return;
    }

    // Reverse the animation back to 0
    activeAnimations.currentImageAnimation.playbackRate = -1;
    if (activeAnimations.previewAnimation) {
      activeAnimations.previewAnimation.playbackRate = -1;
    }

    // Play from current position back to start
    activeAnimations.currentImageAnimation.play();
    activeAnimations.previewAnimation?.play();

    // Listen for finish event to clean up
    const handleFinish = () => {
      activeAnimations.currentImageAnimation.removeEventListener('finish', handleFinish);
      // Reset to original state
      activeAnimations.currentImageAnimation.cancel();
      activeAnimations.previewAnimation?.cancel();

      // Hide the preview container after animation completes
      if (activePreviewContainer) {
        activePreviewContainer.style.display = 'none';
        activePreviewContainer.style.zIndex = '-1';
      }
    };
    activeAnimations.currentImageAnimation.addEventListener('finish', handleFinish, { once: true });

    currentOffsetX = 0;
  };

  const completeTransition = (direction: 'left' | 'right') => {
    if (!imgElement) {
      return;
    }

    // Get the active preview image and its dimensions
    const activePreviewImg = direction === 'right' ? leftPreviewImg : rightPreviewImg;
    const naturalWidth = activePreviewImg?.naturalWidth ?? 1;
    const naturalHeight = activePreviewImg?.naturalHeight ?? 1;

    // Call pre-commit callback BEFORE starting the animation
    // This allows the parent component to update state with the preview dimensions
    options?.onPreCommit?.(direction, naturalWidth, naturalHeight);

    // Get the active animations
    const activeAnimations = direction === 'left' ? leftAnimations : rightAnimations;

    if (!activeAnimations) {
      return;
    }

    // Get current time before modifying animation
    const currentTime = Number(activeAnimations.currentImageAnimation.currentTime) || 0;
    console.log(`Committing transition from ${currentTime}ms / ${ANIMATION_DURATION_MS}ms`);

    // If animation is already at or near the end, skip to finish immediately
    if (currentTime >= ANIMATION_DURATION_MS - 5) {
      console.log('Animation already complete, finishing immediately');

      // Keep the preview visible by hiding the main image but showing the preview
      imgElement.style.opacity = '0';

      // Show the preview that's now in the center
      const activePreview = direction === 'right' ? leftPreviewContainer : rightPreviewContainer;

      if (activePreview) {
        activePreview.style.zIndex = '1'; // Bring to front
      }

      // Trigger navigation (dimensions were already passed in onPreCommit)
      options?.onSwipeCommit?.(direction);
      return;
    }

    // Ensure playback rate is forward (in case it was reversed)
    activeAnimations.currentImageAnimation.playbackRate = 1;
    if (activeAnimations.previewAnimation) {
      activeAnimations.previewAnimation.playbackRate = 1;
    }

    // Play the animation to completion from current position
    activeAnimations.currentImageAnimation.play();
    activeAnimations.previewAnimation?.play();

    // Listen for animation finish
    const handleFinish = () => {
      if (!imgElement) {
        return;
      }

      activeAnimations.currentImageAnimation.removeEventListener('finish', handleFinish);

      // Keep the preview visible by hiding the main image but showing the preview
      // The preview is now centered, and we want it to stay visible while the new component loads
      imgElement.style.opacity = '0';

      // Show the preview that's now in the center
      const activePreview = direction === 'right' ? leftPreviewContainer : rightPreviewContainer;

      if (activePreview) {
        activePreview.style.zIndex = '1'; // Bring to front
      }

      // Trigger navigation (dimensions were already passed in onPreCommit)
      options?.onSwipeCommit?.(direction);
    };

    activeAnimations.currentImageAnimation.addEventListener('finish', handleFinish, { once: true });
  };

  const pointerUp = (event: PointerEvent) => {
    console.log('up', event);
    if (!isDragging || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }

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

    // Calculate animation progress (same calculation as in pointerMove)
    const progress = calculateAnimationProgress(Math.abs(currentOffsetX));

    // Commit if EITHER:
    // 1. High velocity (fast swipe) OR
    // 2. Animation progress is over 25%
    const hasEnoughVelocity = velocity >= 0.11;
    const hasEnoughProgress = progress > 0.25;

    if (Math.abs(swipeAmount) < threshold || (!hasEnoughVelocity && !hasEnoughProgress)) {
      resetPosition();
      return;
    }

    const commitDirection = currentOffsetX > 0 ? 'right' : 'left';

    // Call onSwipeEnd callback
    options?.onSwipeEnd?.(currentOffsetX);

    // complete the transition animation
    completeTransition(commitDirection);
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
      // Cancel all animations
      leftAnimations?.currentImageAnimation?.cancel();
      leftAnimations?.previewAnimation?.cancel();
      rightAnimations?.currentImageAnimation?.cancel();
      rightAnimations?.previewAnimation?.cancel();

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
