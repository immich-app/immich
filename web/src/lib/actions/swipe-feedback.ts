import { preloadManager } from '$lib/managers/PreloadManager.svelte';

export interface SwipeFeedbackOptions {
  disabled?: boolean;
  onSwipeEnd?: (offsetX: number) => void;
  onSwipeMove?: (offsetX: number) => void;
  /** Preview shown on left when swiping right */
  leftPreviewUrl?: string | null;
  /** Preview shown on right when swiping left */
  rightPreviewUrl?: string | null;
  /** Called after animation completes when threshold exceeded */
  onSwipeCommit?: (direction: 'left' | 'right') => void;
  /** Minimum pixels to activate swipe (default: 45) */
  swipeThreshold?: number;
  /** When changed, preview containers are reset */
  currentAssetUrl?: string | null;
  /** Element to apply swipe transforms to */
  target?: HTMLElement | null;
}

interface SwipeAnimations {
  currentImageAnimation: Animation;
  previewAnimation: Animation | null;
}

/**
 * Horizontal swipe gesture with visual feedback and optional preview images.
 * Requires swipeSubject to be provided in options.
 */
export const swipeFeedback = (node: HTMLElement, options?: SwipeFeedbackOptions) => {
  const ANIMATION_DURATION_MS = 300;
  const ENABLE_SCALE_ANIMATION = false;

  let target = options?.target;

  let isDragging = false;
  let startX = 0;
  let currentOffsetX = 0;

  let lastAssetUrl = options?.currentAssetUrl;
  let dragStartTime: Date | null = null;
  let swipeAmount = 0;

  let leftAnimations: SwipeAnimations | null = null;
  let rightAnimations: SwipeAnimations | null = null;

  node.style.cursor = 'grab';

  const getContainersForDirection = (direction: 'left' | 'right') => ({
    animations: direction === 'left' ? leftAnimations : rightAnimations,
    previewContainer: direction === 'left' ? rightPreviewContainer : leftPreviewContainer,
    oppositeAnimations: direction === 'left' ? rightAnimations : leftAnimations,
    oppositeContainer: direction === 'left' ? leftPreviewContainer : rightPreviewContainer,
  });

  const isValidPointerEvent = (event: PointerEvent) =>
    event.isPrimary && (event.pointerType !== 'mouse' || event.button === 0);

  const cancelAnimations = (animations: SwipeAnimations | null) => {
    animations?.currentImageAnimation?.cancel();
    animations?.previewAnimation?.cancel();
  };

  const resetContainerStyle = (container: HTMLElement | null) => {
    if (!container) {
      return;
    }
    container.style.transform = '';
    container.style.transition = '';
    container.style.zIndex = '-1';
    container.style.display = 'none';
  };

  const resetPreviewContainers = () => {
    cancelAnimations(leftAnimations);
    cancelAnimations(rightAnimations);
    leftAnimations = null;
    rightAnimations = null;

    resetContainerStyle(leftPreviewContainer);
    resetContainerStyle(rightPreviewContainer);
    if (target) {
      target.style.transform = '';
      target.style.transition = '';
      target.style.opacity = '';
    }
    currentOffsetX = 0;
  };

  const createAnimationKeyframes = (direction: 'left' | 'right', isPreview: boolean) => {
    const scale = (s: number) => (ENABLE_SCALE_ANIMATION ? ` scale(${s})` : '');
    const sign = direction === 'left' ? -1 : 1;

    if (isPreview) {
      return [
        { transform: `translateX(${sign * -100}vw)${scale(0)}`, opacity: '0', offset: 0 },
        { transform: `translateX(${sign * -80}vw)${scale(0.2)}`, opacity: '0', offset: 0.2 },
        { transform: `translateX(${sign * -50}vw)${scale(0.5)}`, opacity: '0.5', offset: 0.5 },
        { transform: `translateX(${sign * -20}vw)${scale(0.8)}`, opacity: '1', offset: 0.8 },
        { transform: `translateX(0)${scale(1)}`, opacity: '1', offset: 1 },
      ];
    }

    return [
      { transform: `translateX(0)${scale(1)}`, opacity: '1', offset: 0 },
      { transform: `translateX(${sign * 100}vw)${scale(0)}`, opacity: '0', offset: 1 },
    ];
  };

  const createSwipeAnimations = (direction: 'left' | 'right'): SwipeAnimations | null => {
    if (!target) {
      return null;
    }

    target.style.transformOrigin = 'center';

    const currentImageAnimation = target.animate(createAnimationKeyframes(direction, false), {
      duration: ANIMATION_DURATION_MS,
      easing: 'linear',
      fill: 'both',
    });

    const { previewContainer } = getContainersForDirection(direction);
    let previewAnimation: Animation | null = null;

    if (previewContainer) {
      previewContainer.style.transformOrigin = 'center';
      previewAnimation = previewContainer.animate(createAnimationKeyframes(direction, true), {
        duration: ANIMATION_DURATION_MS,
        easing: 'linear',
        fill: 'both',
      });
    }

    currentImageAnimation.pause();
    previewAnimation?.pause();

    return { currentImageAnimation, previewAnimation };
  };

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

  const ensurePreviewCreated = (
    url: string | null | undefined,
    container: HTMLDivElement | null,
    img: HTMLImageElement | null,
  ) => {
    if (!url || container) {
      return { container, img };
    }
    const preview = createPreviewContainer();
    preview.img.src = url;
    return preview;
  };

  const ensurePreviewsCreated = () => {
    if (options?.leftPreviewUrl && !leftPreviewContainer) {
      const preview = ensurePreviewCreated(options.leftPreviewUrl, leftPreviewContainer, leftPreviewImg);
      leftPreviewContainer = preview.container;
      leftPreviewImg = preview.img;
    }

    if (options?.rightPreviewUrl && !rightPreviewContainer) {
      const preview = ensurePreviewCreated(options.rightPreviewUrl, rightPreviewContainer, rightPreviewImg);
      rightPreviewContainer = preview.container;
      rightPreviewImg = preview.img;
    }
  };

  const positionContainer = (container: HTMLElement | null, width: number, height: number) => {
    if (!container) {
      return;
    }
    Object.assign(container.style, {
      width: `${width}px`,
      height: `${height}px`,
      left: '0px',
      top: '0px',
    });
  };

  const updatePreviewPositions = () => {
    const parentElement = node.parentElement;
    if (!parentElement) {
      return;
    }

    const { width, height } = globalThis.getComputedStyle(parentElement);
    const viewportWidth = Number.parseFloat(width);
    const viewportHeight = Number.parseFloat(height);

    positionContainer(leftPreviewContainer, viewportWidth, viewportHeight);
    positionContainer(rightPreviewContainer, viewportWidth, viewportHeight);
  };

  const calculateAnimationProgress = (dragPixels: number) => Math.min(dragPixels / window.innerWidth, 1);

  const pointerDown = (event: PointerEvent) => {
    if (options?.disabled || !target || !isValidPointerEvent(event)) {
      return;
    }

    isDragging = true;
    startX = event.clientX;
    swipeAmount = 0;

    node.style.cursor = 'grabbing';
    node.setPointerCapture(event.pointerId);
    dragStartTime = new Date();

    document.addEventListener('pointerup', pointerUp);
    document.addEventListener('pointercancel', pointerUp);

    ensurePreviewsCreated();
    updatePreviewPositions();

    event.preventDefault();
  };

  const setContainerVisibility = (container: HTMLElement | null, visible: boolean) => {
    if (!container) {
      return;
    }
    container.style.display = visible ? 'block' : 'none';
    if (visible) {
      container.style.zIndex = '1';
    }
  };

  const updateAnimationTime = (animations: SwipeAnimations, time: number) => {
    animations.currentImageAnimation.currentTime = time;
    if (animations.previewAnimation) {
      animations.previewAnimation.currentTime = time;
    }
  };

  const pointerMove = (event: PointerEvent) => {
    if (options?.disabled || !target || !isDragging) {
      return;
    }

    currentOffsetX = event.clientX - startX;
    swipeAmount = currentOffsetX;

    const direction = currentOffsetX < 0 ? 'left' : 'right';
    const animationTime = calculateAnimationProgress(Math.abs(currentOffsetX)) * ANIMATION_DURATION_MS;
    const { animations, previewContainer, oppositeAnimations, oppositeContainer } =
      getContainersForDirection(direction);

    if (!animations) {
      if (direction === 'left') {
        leftAnimations = createSwipeAnimations('left');
      } else {
        rightAnimations = createSwipeAnimations('right');
      }
      setContainerVisibility(previewContainer, true);
    }

    const currentAnimations = direction === 'left' ? leftAnimations : rightAnimations;
    if (currentAnimations) {
      setContainerVisibility(previewContainer, true);
      updateAnimationTime(currentAnimations, animationTime);
      if (oppositeAnimations) {
        cancelAnimations(oppositeAnimations);
        if (direction === 'left') {
          rightAnimations = null;
        } else {
          leftAnimations = null;
        }
        setContainerVisibility(oppositeContainer, false);
      }
    }
    options?.onSwipeMove?.(currentOffsetX);
    event.preventDefault();
  };

  const setPlaybackRate = (animations: SwipeAnimations, rate: number) => {
    animations.currentImageAnimation.playbackRate = rate;
    if (animations.previewAnimation) {
      animations.previewAnimation.playbackRate = rate;
    }
  };

  const playAnimations = (animations: SwipeAnimations) => {
    animations.currentImageAnimation.play();
    animations.previewAnimation?.play();
  };

  const resetPosition = () => {
    if (!target) {
      return;
    }

    const direction = currentOffsetX < 0 ? 'left' : 'right';
    const { animations, previewContainer } = getContainersForDirection(direction);

    if (!animations) {
      currentOffsetX = 0;
      return;
    }

    setPlaybackRate(animations, -1);
    playAnimations(animations);

    const handleFinish = () => {
      animations.currentImageAnimation.removeEventListener('finish', handleFinish);
      cancelAnimations(animations);
      resetContainerStyle(previewContainer);
    };
    animations.currentImageAnimation.addEventListener('finish', handleFinish, { once: true });

    currentOffsetX = 0;
  };

  const commitSwipe = (direction: 'left' | 'right') => {
    if (!target) {
      return;
    }
    target.style.opacity = '0';
    const { previewContainer } = getContainersForDirection(direction);
    if (previewContainer) {
      previewContainer.style.zIndex = '1';
    }
    options?.onSwipeCommit?.(direction);
  };

  const completeTransition = (direction: 'left' | 'right') => {
    if (!target) {
      return;
    }

    const { animations } = getContainersForDirection(direction);
    if (!animations) {
      return;
    }

    const currentTime = Number(animations.currentImageAnimation.currentTime) || 0;

    if (currentTime >= ANIMATION_DURATION_MS - 5) {
      commitSwipe(direction);
      return;
    }

    setPlaybackRate(animations, 1);
    playAnimations(animations);

    const handleFinish = () => {
      if (target) {
        commitSwipe(direction);
      }
    };
    animations.currentImageAnimation.addEventListener('finish', handleFinish, { once: true });
  };

  const pointerUp = (event: PointerEvent) => {
    if (!isDragging || !isValidPointerEvent(event) || !target) {
      return;
    }

    isDragging = false;
    node.style.cursor = 'grab';
    if (node.hasPointerCapture(event.pointerId)) {
      node.releasePointerCapture(event.pointerId);
    }
    document.removeEventListener('pointerup', pointerUp);
    document.removeEventListener('pointercancel', pointerUp);

    const threshold = options?.swipeThreshold ?? 45;
    const velocity = Math.abs(swipeAmount) / (Date.now() - (dragStartTime?.getTime() ?? 0));
    const progress = calculateAnimationProgress(Math.abs(currentOffsetX));

    if (Math.abs(swipeAmount) < threshold || (velocity < 0.11 && progress <= 0.25)) {
      resetPosition();
      return;
    }

    options?.onSwipeEnd?.(currentOffsetX);
    completeTransition(currentOffsetX > 0 ? 'right' : 'left');
  };

  node.addEventListener('pointerdown', pointerDown);
  node.addEventListener('pointermove', pointerMove);
  node.addEventListener('pointerup', pointerUp);
  node.addEventListener('pointercancel', pointerUp);

  return {
    update(newOptions?: SwipeFeedbackOptions) {
      if (newOptions?.target && newOptions.target !== target) {
        resetPreviewContainers();
        target = newOptions.target;
      }

      if (newOptions?.currentAssetUrl && newOptions.currentAssetUrl !== lastAssetUrl) {
        resetPreviewContainers();
        lastAssetUrl = newOptions.currentAssetUrl;
      }
      const lastLeftPreviewUrl = options?.leftPreviewUrl;
      const lastRightPreviewUrl = options?.rightPreviewUrl;
      if (
        lastLeftPreviewUrl &&
        lastLeftPreviewUrl != newOptions?.leftPreviewUrl &&
        lastLeftPreviewUrl !== newOptions?.currentAssetUrl
      ) {
        preloadManager.cancelPreloadUrl(lastLeftPreviewUrl);
      }
      if (
        lastRightPreviewUrl &&
        lastRightPreviewUrl != newOptions?.rightPreviewUrl &&
        lastRightPreviewUrl !== newOptions?.currentAssetUrl
      ) {
        preloadManager.cancelPreloadUrl(lastRightPreviewUrl);
      }
      options = newOptions;

      if (options?.leftPreviewUrl) {
        if (leftPreviewImg) {
          leftPreviewImg.src = options.leftPreviewUrl;
        } else {
          const preview = ensurePreviewCreated(options.leftPreviewUrl, leftPreviewContainer, leftPreviewImg);
          leftPreviewContainer = preview.container;
          leftPreviewImg = preview.img;
        }
      }

      if (options?.rightPreviewUrl) {
        if (rightPreviewImg) {
          rightPreviewImg.src = options.rightPreviewUrl;
        } else {
          const preview = ensurePreviewCreated(options.rightPreviewUrl, rightPreviewContainer, rightPreviewImg);
          rightPreviewContainer = preview.container;
          rightPreviewImg = preview.img;
        }
      }
    },
    destroy() {
      cancelAnimations(leftAnimations);
      cancelAnimations(rightAnimations);

      node.removeEventListener('pointerdown', pointerDown);
      node.removeEventListener('pointermove', pointerMove);
      node.removeEventListener('pointerup', pointerUp);
      node.removeEventListener('pointercancel', pointerUp);
      document.removeEventListener('pointerup', pointerUp);
      document.removeEventListener('pointercancel', pointerUp);
      leftPreviewContainer?.remove();
      rightPreviewContainer?.remove();
      node.style.cursor = '';
    },
  };
};
