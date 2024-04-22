import { currentMediaBreakpoint, MediaBreakpoint } from '$lib/stores/media-breakpoint.store';
import type { ActionReturn } from 'svelte/action';

export interface MediaBreakpointCallbacks {
  match?: () => unknown;
  unmatch?: () => unknown;
}

const handleBreakpoint = (
  target: MediaBreakpoint,
  callbacks: MediaBreakpointCallbacks,
): ActionReturn<MediaBreakpointCallbacks> => {
  let isAtOrAbove = false;
  const unsubscribe = currentMediaBreakpoint.subscribe((breakpoint) => {
    if (breakpoint >= target) {
      if (!isAtOrAbove) {
        // The viewport width is now at or above the target breakpoint
        callbacks.match?.();
        isAtOrAbove = true;
      }
    } else if (isAtOrAbove) {
      // The viewport width is now below the target breakpoint
      callbacks.unmatch?.();
      isAtOrAbove = false;
    }
  });
  return {
    update(newCallbacks) {
      callbacks = newCallbacks;
    },
    destroy: unsubscribe,
  };
};

export const xxs = <T extends HTMLElement>(_: T, callbacks: MediaBreakpointCallbacks) => {
  return handleBreakpoint(MediaBreakpoint.XXS, callbacks);
};

export const xs = <T extends HTMLElement>(_: T, callbacks: MediaBreakpointCallbacks) => {
  return handleBreakpoint(MediaBreakpoint.XS, callbacks);
};

export const sm = <T extends HTMLElement>(_: T, callbacks: MediaBreakpointCallbacks) => {
  return handleBreakpoint(MediaBreakpoint.SM, callbacks);
};

export const md = <T extends HTMLElement>(_: T, callbacks: MediaBreakpointCallbacks) => {
  return handleBreakpoint(MediaBreakpoint.MD, callbacks);
};

export const lg = <T extends HTMLElement>(_: T, callbacks: MediaBreakpointCallbacks) => {
  return handleBreakpoint(MediaBreakpoint.LG, callbacks);
};

export const xl = <T extends HTMLElement>(_: T, callbacks: MediaBreakpointCallbacks) => {
  return handleBreakpoint(MediaBreakpoint.XL, callbacks);
};

export const xxl = <T extends HTMLElement>(_: T, callbacks: MediaBreakpointCallbacks) => {
  return handleBreakpoint(MediaBreakpoint.XXL, callbacks);
};
