import { tick } from 'svelte';
import type { ActionReturn } from 'svelte/action';

interface Attributes {
	'on:image-error'?: (e: CustomEvent) => void;
	'on:image-load'?: (e: CustomEvent) => void;
}

export function imageLoad(img: HTMLImageElement): ActionReturn<void, Attributes> {
	const onImageError = () => img.dispatchEvent(new CustomEvent('image-error'));
	const onImageLoaded = () => img.dispatchEvent(new CustomEvent('image-load'));

	if (img.complete) {
		// Browser has fetched the image, naturalHeight is used to check
		// if any loading errors have occurred.
		const loadingError = img.naturalHeight === 0;

		// Report status after a tick, to make sure event listeners are registered.
		if (loadingError) {
			tick().then(onImageError);
		} else {
			tick().then(onImageLoaded);
		}

		return {};
	}

	// Image has not been loaded yet, report status with event listeners.
	img.addEventListener('load', onImageLoaded, { once: true });
	img.addEventListener('error', onImageError, { once: true });

	return {
		destroy() {
			img.removeEventListener('load', onImageLoaded);
			img.removeEventListener('error', onImageError);
		}
	};
}
