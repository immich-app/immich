import { MediaQuery } from 'svelte/reactivity';

const hoverNone = new MediaQuery('hover: none');
const maxMd = new MediaQuery('max-width: 767px');


export const mobileDevice = {
  get hoverNone() {
    return hoverNone.current;
  },
  get maxMd() {
    return maxMd.current;
  }
};
