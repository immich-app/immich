import { derived, readable } from 'svelte/store';

const isUsingCoarsePointer = () => {
  if (!window.matchMedia) {
    return false;
  } else if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return false;
  } else if (window.matchMedia('(any-hover: hover) and (pointer: fine)').matches) {
    return false;
  }
  return true;
}

export const isUserUsingTouchDevice = readable(isUsingCoarsePointer(), (set) => {
  let isTouching = false;
  let lastTouchEvent = 0;

  const onTouchStart = () => {
    isTouching = true;
    set(true);
  };

  const onTouchEnd = () => {
    isTouching = false;
    lastTouchEvent = Date.now();
    set(true);
  };

  const onMouseMove = () => {
    if (!isTouching && (lastTouchEvent === 0 || Date.now() - lastTouchEvent >= 1000)) {
      // We make sure the last touch event has been made at least 1s before.
      // Otherwise, it may indicate the browser has emitted a 'mousevent'
      // despite being touch-only.
      set(false);
    }
  };

  // Following events are listened to handle cases where the user got both
  // pointing devices, typically when using a touch laptop:
  window.addEventListener('touchstart', onTouchStart);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('touchend', onTouchEnd);

  return () => {
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('touchend', onTouchEnd);
  };
});

export const isUserUsingMouse = derived(isUserUsingTouchDevice, ($isUserUsingTouchDevice) => {
  return !$isUserUsingTouchDevice;
});
