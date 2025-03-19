import { MediaQuery } from 'svelte/reactivity';

const hoverNone = new MediaQuery('hover: none');

export const mobileDevice = {
  get hoverNone() {
    return hoverNone.current;
  },
};
