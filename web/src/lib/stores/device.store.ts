import { writable } from 'svelte/store';

let initialIsMobile = false;

if (typeof window !== 'undefined') {
    initialIsMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export const isMobile = writable<boolean>(initialIsMobile);