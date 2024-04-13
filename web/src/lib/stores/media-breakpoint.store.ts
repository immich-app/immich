import { readable } from 'svelte/store';

export enum MediaBreakpoint {
  XXL = 1536,
  XL = 1280,
  LG = 1024,
  MD = 768,
  SM = 640,
  XS = 0,
}

const mediaBreakpoints: MediaBreakpoint[] = [
  MediaBreakpoint.XXL,
  MediaBreakpoint.XL,
  MediaBreakpoint.LG,
  MediaBreakpoint.MD,
  MediaBreakpoint.SM,
];

const getCurrentBreakpoint = () => {
  const currentBreakpoint = mediaBreakpoints.find((breakpoint) => {
    return window?.matchMedia(`(min-width: ${breakpoint}px)`).matches;
  });
  return currentBreakpoint ?? MediaBreakpoint.XS;
};

export const currentMediaBreakpoint = readable(getCurrentBreakpoint(), (set) => {
  const updateBreakpoint = () => {
    set(getCurrentBreakpoint());
  };

  window.addEventListener('resize', updateBreakpoint);

  return () => {
    window.removeEventListener('resize', updateBreakpoint);
  };
});
