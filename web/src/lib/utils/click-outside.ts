import type { ActionReturn } from 'svelte/action';

interface Attributes {
	'on:outclick'?: (e: CustomEvent) => void;
}

export function clickOutside(node: HTMLElement): ActionReturn<void, Attributes> {
	const handleClick = (event: MouseEvent) => {
		const targetNode = event.target as Node | null;
		if (!node.contains(targetNode)) {
			node.dispatchEvent(new CustomEvent('outclick'));
		}
	};

	const handleKey = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			node.dispatchEvent(new CustomEvent('outclick'));
		}
	};

	document.addEventListener('click', handleClick, true);
	document.addEventListener('keydown', handleKey, true);

	return {
		destroy() {
			document.removeEventListener('click', handleClick, true);
			document.removeEventListener('keydown', handleKey, true);
		}
	};
}
