<script lang="ts">
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import type { Snippet } from 'svelte';
  import { onDestroy, onMount } from 'svelte';

  interface Props {
    disabled?: boolean;
    disableSwipeLeft?: boolean;
    disableSwipeRight?: boolean;
    onSwipeEnd?: (offsetX: number) => void;
    onSwipeMove?: (offsetX: number) => void;
    onSwipe?: (direction: 'left' | 'right') => void;
    swipeThreshold?: number;
    class?: string;
    transitionName?: string;
    element?: HTMLDivElement;
    clientWidth?: number;
    clientHeight?: number;
    reset?: () => void;
    children: Snippet;
    leftPreview?: Snippet;
    rightPreview?: Snippet;
  }

  let {
    disabled = false,
    disableSwipeLeft = false,
    disableSwipeRight = false,
    onSwipeEnd,
    onSwipeMove,
    onSwipe,
    swipeThreshold = 45,
    class: className = '',
    transitionName,
    element = $bindable(),
    clientWidth = $bindable(),
    clientHeight = $bindable(),
    reset = $bindable(),
    children,
    leftPreview,
    rightPreview,
  }: Props = $props();

  interface SwipeAnimations {
    currentImageAnimation: Animation;
    previewAnimation: Animation | null;
    abortController: AbortController;
  }

  const ANIMATION_DURATION_MS = 300;
  // Tolerance to avoid edge cases where animation is nearly complete but not exactly at end
  const ANIMATION_COMPLETION_TOLERANCE_MS = 5;
  // Minimum velocity to trigger swipe (tuned for natural flick gesture)
  const MIN_SWIPE_VELOCITY = 0.11; // pixels per millisecond
  // Require 25% drag progress if velocity is too low (prevents accidental swipes)
  const MIN_PROGRESS_THRESHOLD = 0.25;
  const ENABLE_SCALE_ANIMATION = false;

  let contentElement: HTMLElement | undefined = $state();
  let leftPreviewContainer: HTMLDivElement | undefined = $state();
  let rightPreviewContainer: HTMLDivElement | undefined = $state();

  let isDragging = $state(false);
  let startX = $state(0);
  let currentOffsetX = $state(0);
  let dragStartTime: number | null = $state(null);

  let leftAnimations: SwipeAnimations | null = $state(null);
  let rightAnimations: SwipeAnimations | null = $state(null);
  let isSwipeInProgress = $state(false);

  const cursorStyle = $derived(disabled ? '' : isSwipeInProgress ? 'wait' : isDragging ? 'grabbing' : 'grab');

  const isValidPointerEvent = (event: PointerEvent) =>
    event.isPrimary && (event.pointerType !== 'mouse' || event.button === 0);

  const createSwipeAnimations = (direction: 'left' | 'right'): SwipeAnimations | null => {
    if (!contentElement) {
      return null;
    }

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

    contentElement.style.transformOrigin = 'center';

    const currentImageAnimation = contentElement.animate(createAnimationKeyframes(direction, false), {
      duration: ANIMATION_DURATION_MS,
      easing: 'linear',
      fill: 'both',
    });

    // Preview slides in from opposite side of swipe direction
    const previewContainer = direction === 'left' ? rightPreviewContainer : leftPreviewContainer;
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

    const abortController = new AbortController();

    return { currentImageAnimation, previewAnimation, abortController };
  };

  const setAnimationTime = (animations: SwipeAnimations, time: number) => {
    animations.currentImageAnimation.currentTime = time;
    if (animations.previewAnimation) {
      animations.previewAnimation.currentTime = time;
    }
  };

  const playAnimation = (animations: SwipeAnimations, playbackRate: number) => {
    animations.currentImageAnimation.playbackRate = playbackRate;
    if (animations.previewAnimation) {
      animations.previewAnimation.playbackRate = playbackRate;
    }
    animations.currentImageAnimation.play();
    animations.previewAnimation?.play();
  };

  const cancelAnimations = (animations: SwipeAnimations | null) => {
    if (!animations) {
      return;
    }
    animations.abortController.abort();
    animations.currentImageAnimation.cancel();
    animations.previewAnimation?.cancel();
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (disabled || !contentElement || !isValidPointerEvent(event) || !element || isSwipeInProgress) {
      return;
    }

    startDrag(event);
    event.preventDefault();
  };

  const startDrag = (event: PointerEvent) => {
    if (!element) {
      return;
    }

    isDragging = true;
    startX = event.clientX;
    currentOffsetX = 0;

    element.setPointerCapture(event.pointerId);
    dragStartTime = Date.now();
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (disabled || !contentElement || !isDragging || isSwipeInProgress) {
      return;
    }

    const rawOffsetX = event.clientX - startX;
    const direction = rawOffsetX < 0 ? 'left' : 'right';

    if ((direction === 'left' && disableSwipeLeft) || (direction === 'right' && disableSwipeRight)) {
      currentOffsetX = 0;
      cancelAnimations(leftAnimations);
      cancelAnimations(rightAnimations);
      leftAnimations = null;
      rightAnimations = null;
      return;
    }

    currentOffsetX = rawOffsetX;
    const animationTime = Math.min(Math.abs(currentOffsetX) / window.innerWidth, 1) * ANIMATION_DURATION_MS;

    if (direction === 'left') {
      if (!leftAnimations) {
        leftAnimations = createSwipeAnimations('left');
      }
      if (leftAnimations) {
        setAnimationTime(leftAnimations, animationTime);
      }
      if (rightAnimations) {
        cancelAnimations(rightAnimations);
        rightAnimations = null;
      }
    } else {
      if (!rightAnimations) {
        rightAnimations = createSwipeAnimations('right');
      }
      if (rightAnimations) {
        setAnimationTime(rightAnimations, animationTime);
      }
      if (leftAnimations) {
        cancelAnimations(leftAnimations);
        leftAnimations = null;
      }
    }
    onSwipeMove?.(currentOffsetX);
    event.preventDefault(); // Prevent scrolling during drag
  };

  const handlePointerUp = (event: PointerEvent) => {
    if (!isDragging || !isValidPointerEvent(event) || !contentElement || !element) {
      return;
    }

    isDragging = false;
    if (element.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId);
    }

    const dragDuration = dragStartTime ? Date.now() - dragStartTime : 0;
    const velocity = dragDuration > 0 ? Math.abs(currentOffsetX) / dragDuration : 0;
    const progress = Math.min(Math.abs(currentOffsetX) / window.innerWidth, 1);

    if (
      Math.abs(currentOffsetX) < swipeThreshold ||
      (velocity < MIN_SWIPE_VELOCITY && progress <= MIN_PROGRESS_THRESHOLD)
    ) {
      resetPosition();
      return;
    }

    isSwipeInProgress = true;

    onSwipeEnd?.(currentOffsetX);
    completeTransition(currentOffsetX > 0 ? 'right' : 'left');
  };

  const resetPosition = () => {
    if (!contentElement) {
      return;
    }

    const direction = currentOffsetX < 0 ? 'left' : 'right';
    const animations = direction === 'left' ? leftAnimations : rightAnimations;

    if (!animations) {
      currentOffsetX = 0;
      return;
    }

    playAnimation(animations, -1);

    const handleFinish = () => {
      cancelAnimations(animations);
      if (direction === 'left') {
        leftAnimations = null;
      } else {
        rightAnimations = null;
      }
    };
    animations.currentImageAnimation.addEventListener('finish', handleFinish, {
      signal: animations.abortController.signal,
    });

    currentOffsetX = 0;
  };

  const completeTransition = (direction: 'left' | 'right') => {
    if (!contentElement) {
      return;
    }

    const animations = direction === 'left' ? leftAnimations : rightAnimations;
    if (!animations) {
      return;
    }

    const currentTime = Number(animations.currentImageAnimation.currentTime) || 0;

    if (currentTime >= ANIMATION_DURATION_MS - ANIMATION_COMPLETION_TOLERANCE_MS) {
      onSwipe?.(direction);
      return;
    }

    playAnimation(animations, 1);

    const handleFinish = () => {
      if (contentElement) {
        onSwipe?.(direction);
      }
    };
    animations.currentImageAnimation.addEventListener('finish', handleFinish, {
      signal: animations.abortController.signal,
    });
  };

  const resetPreviewContainers = () => {
    cancelAnimations(leftAnimations);
    cancelAnimations(rightAnimations);
    leftAnimations = null;
    rightAnimations = null;

    if (contentElement) {
      contentElement.style.transform = '';
      contentElement.style.transition = '';
      contentElement.style.opacity = '';
    }
    currentOffsetX = 0;
  };

  const finishSwipeInProgress = () => {
    isSwipeInProgress = false;
  };

  const resetSwipeFeedback = () => {
    resetPreviewContainers();
    finishSwipeInProgress();
  };

  reset = resetSwipeFeedback;
  onMount(() =>
    eventManager.on({
      ViewerFinishNavigate: finishSwipeInProgress,
      ResetSwipeFeedback: resetSwipeFeedback,
    }),
  );

  onDestroy(() => {
    resetSwipeFeedback();
    if (element) {
      element.style.cursor = '';
    }
    if (contentElement) {
      contentElement.style.cursor = '';
    }
  });
</script>

<!-- Listen on window to catch pointer release outside element (due to setPointerCapture) -->
<svelte:window onpointerup={handlePointerUp} onpointercancel={handlePointerUp} />

<div
  bind:this={element}
  bind:clientWidth
  bind:clientHeight
  class={className}
  style:cursor={cursorStyle}
  style:view-transition-name={transitionName}
  onpointerdown={handlePointerDown}
  onpointermove={handlePointerMove}
  role="presentation"
>
  {#if leftPreview}
    <!-- Swiping right reveals left preview -->
    <div
      bind:this={leftPreviewContainer}
      class="absolute inset-0"
      style:pointer-events="none"
      style:display={rightAnimations ? 'block' : 'none'}
    >
      {@render leftPreview()}
    </div>
  {/if}

  {#if rightPreview}
    <!-- Swiping left reveals right preview -->
    <div
      bind:this={rightPreviewContainer}
      class="absolute inset-0"
      style:pointer-events="none"
      style:display={leftAnimations ? 'block' : 'none'}
    >
      {@render rightPreview()}
    </div>
  {/if}

  <div bind:this={contentElement} class="h-full w-full" style:cursor={cursorStyle}>
    {@render children()}
  </div>
</div>
