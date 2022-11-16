/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare namespace App {
	interface Locals {
		user?: import('@api').UserResponseDto;
	}

	// interface Platform {}
}

// Source: https://stackoverflow.com/questions/63814432/typescript-typing-of-non-standard-window-event-in-svelte
// To fix the <svelte:window... in components/asset-viewer/photo-viewer.svelte
declare namespace svelte.JSX {
	interface HTMLAttributes<T> {
		oncopyImage?: () => void;
	}
}
