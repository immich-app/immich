<script lang="ts">
	import { clickOutside } from '$lib/utils/click-outside';
	import { createEventDispatcher } from 'svelte';
	import { quintOut } from 'svelte/easing';
	import { slide } from 'svelte/transition';

	/**
	 * x coordiante of the context menu.
	 */
	export let x = 0;

	/**
	 * x coordiante of the context menu.
	 */
	export let y = 0;

	const dispatch = createEventDispatcher();

	let menuEl: HTMLElement;

	$: (() => {
		if (!menuEl) return;

		const rect = menuEl.getBoundingClientRect();
		x = Math.min(window.innerWidth - rect.width, x);
		if (y > window.innerHeight - rect.height) {
			y -= rect.height;
		}
	})();
</script>

<div
	transition:slide={{ duration: 200, easing: quintOut }}
	bind:this={menuEl}
	class="absolute w-[200px] z-[99999] rounded-lg overflow-hidden shadow-lg"
	style={`top: ${y}px; left: ${x}px;`}
	use:clickOutside
	on:outclick={() => dispatch('clickoutside')}
>
	<slot />
</div>
