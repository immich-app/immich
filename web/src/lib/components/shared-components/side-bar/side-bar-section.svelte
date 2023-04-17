<script lang="ts">
	import { onMount } from 'svelte';

	export let isCollapsed = false;
	let innerWidth: number;

	const handleResize = () => {
		if (innerWidth > 768) {
			isCollapsed = false;
		} else {
			isCollapsed = true;
		}
	};

	onMount(() => {
		handleResize();
	});
</script>

<svelte:window on:resize={handleResize} bind:innerWidth />

<section
	id="sidebar"
	on:mouseover={() => (innerWidth >= 640 ? (isCollapsed = false) : null)}
	on:focus={() => (innerWidth >= 640 ? (isCollapsed = false) : null)}
	on:mouseleave={() => handleResize()}
	class="flex flex-col gap-1 pt-8 bg-immich-bg dark:bg-immich-dark-bg transition-[width] duration-200 z-10 max-sm:w-[72px] {isCollapsed
		? 'w-[72px]'
		: 'sm:pr-6 sm:w-64 sm:shadow-2xl md:shadow-none md:border-none sm:border-r sm:dark:border-r-immich-dark-gray'}"
>
	<slot />
</section>
