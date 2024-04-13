import { writable } from 'svelte/store';

export const isSideBarOpen = writable<boolean>(false);

// We want to keep the hover state in a store since the sidebar is recreated
// when switching pages. Not doing so would make the sidebar flicker (state
// would be 'false' then set to 'true' the very next frame)
export const isSideBarHovered = writable<boolean>(false);
