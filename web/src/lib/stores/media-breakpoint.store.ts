import { readable } from 'svelte/store';

export enum MediaBreakpoint {
  XXL = 1536,
  XL = 1280,
  LG = 1024,
  MD = 768,
  SM = 640,
  XS = 504,
  XXS = 368,
  Default = 0,
}

const mediaBreakpoints: MediaBreakpoint[] = [
  MediaBreakpoint.XXL,
  MediaBreakpoint.XL,
  MediaBreakpoint.LG,
  MediaBreakpoint.MD,
  MediaBreakpoint.SM,
  MediaBreakpoint.XS,
  MediaBreakpoint.XXS,
  MediaBreakpoint.Default,
];

const getCurrentBreakpointIndex = () => {
  const currentBreakpointIndex = mediaBreakpoints.findIndex((breakpoint) => {
    return window?.matchMedia(`(min-width: ${breakpoint}px)`).matches;
  });
  return currentBreakpointIndex >= 0 ? currentBreakpointIndex : mediaBreakpoints.length - 1;
};

let currentIndex = getCurrentBreakpointIndex();

export const currentMediaBreakpoint = readable(mediaBreakpoints[currentIndex], (set) => {
  const updateBreakpoint = () => {
    const newIndex = getCurrentBreakpointIndex();
    if (newIndex === currentIndex) {
      return;
    }
    // If the screen width has decreased, we will enter this while-loop
    while (newIndex > currentIndex) {
      set(mediaBreakpoints[++currentIndex]);
    }
    // If the screen width has increased, we will enter this while-loop
    while (newIndex < currentIndex) {
      set(mediaBreakpoints[--currentIndex]);
    }
  };

  updateBreakpoint();
  window.addEventListener('resize', updateBreakpoint);

  return () => {
    window.removeEventListener('resize', updateBreakpoint);
  };
});
