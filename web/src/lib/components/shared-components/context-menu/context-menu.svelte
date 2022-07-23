<script lang="ts">
	import { clickOutside } from '$lib/utils/click-outside';
	import { createEventDispatcher } from 'svelte';
	import { quintOut } from 'svelte/easing';
	import { slide } from 'svelte/transition';

	export let x: number = 0;
	export let y: number = 0;

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
	class="absolute bg-white w-[150px] z-[99999] rounded-lg shadow-md"
	style={`top: ${y}px; left: ${x}px;`}
	use:clickOutside
	on:out-click={() => dispatch('clickoutside')}
>
	<slot />
</div>
