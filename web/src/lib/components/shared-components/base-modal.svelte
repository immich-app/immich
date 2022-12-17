<script lang="ts">
	import { fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import Close from 'svelte-material-icons/Close.svelte';
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import CircleIconButton from './circle-icon-button.svelte';
	import { clickOutside } from '$lib/utils/click-outside';

	const dispatch = createEventDispatcher();
	export let zIndex = 9999;

	onMount(() => {
		if (browser) {
			const scrollTop = document.documentElement.scrollTop;
			const scrollLeft = document.documentElement.scrollLeft;
			window.onscroll = function () {
				window.scrollTo(scrollLeft, scrollTop);
			};
		}
	});

	onDestroy(() => {
		if (browser) {
			window.onscroll = null;
		}
	});
</script>

<div
	id="immich-modal"
	style:z-index={zIndex}
	transition:fade={{ duration: 100, easing: quintOut }}
	class="fixed top-0 w-full h-full  bg-black/50 flex place-items-center place-content-center overflow-hidden"
>
	<div
		use:clickOutside
		on:outclick={() => dispatch('close')}
		class="bg-immich-bg dark:bg-immich-dark-gray dark:text-immich-dark-fg w-[450px] min-h-[200px] max-h-[500px] rounded-lg shadow-md"
	>
		<div class="flex justify-between place-items-center px-5 py-3">
			<div>
				<slot name="title">
					<p>Modal Title</p>
				</slot>
			</div>

			<CircleIconButton on:click={() => dispatch('close')} logo={Close} size={'20'} />
		</div>

		<div class="">
			<slot />
		</div>
	</div>
</div>
