import { readable } from 'svelte/store';

export interface Viewport {
  width: number;
  height: number;
}

const getWindowViewport = (): Viewport => {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

export const windowViewport = readable(getWindowViewport(), (set) => {
  const updateWindowViewport = () => {
    set(getWindowViewport());
  };

  updateWindowViewport();
  window.addEventListener('resize', updateWindowViewport);

  return () => {
    window.removeEventListener('resize', updateWindowViewport);
  };
});
