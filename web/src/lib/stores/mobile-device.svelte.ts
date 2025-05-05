import { MediaQuery } from 'svelte/reactivity';

const pointerCoarse = new MediaQuery('pointer:coarse');
const maxMd = new MediaQuery('max-width: 767px');
const sidebar = new MediaQuery(`min-width: 850px`);

export const mobileDevice = {
  get pointerCoarse() {
    return pointerCoarse.current;
  },
  get maxMd() {
    return maxMd.current;
  },
  get isFullSidebar() {
    return sidebar.current;
  },
};
