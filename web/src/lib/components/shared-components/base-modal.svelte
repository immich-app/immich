<script lang="ts">
	import { fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import Close from 'svelte-material-icons/Close.svelte';
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { browser } from '$app/env';

	const dispatch = createEventDispatcher();

	onMount(() => {
		const scrollTop = document?.documentElement.scrollTop;
		const scrollLeft = document?.documentElement.scrollLeft;
		window.onscroll = function () {
			window.scrollTo(scrollLeft, scrollTop);
		};
	});

	onDestroy(() => {
		window.onscroll = function () {};
	});
</script>

<div
	id="immich-modal"
	transition:fade={{ duration: 100, easing: quintOut }}
	class="fixed top-0 w-full h-full z-[9999] bg-black/50 flex place-items-center place-content-center overflow-hidden"
>
	<div class="bg-white w-[450px] min-h-[200px] max-h-[500px] rounded-lg shadow-md">
		<div class="flex justify-between place-items-center p-5">
			<div>
				<slot name="title">
					<p>Modal Title</p>
				</slot>
			</div>
			<button on:click={() => dispatch('close')}>
				<Close size="24" />
			</button>
		</div>

		<div class="mt-4">
			<slot />
		</div>
	</div>
</div>
