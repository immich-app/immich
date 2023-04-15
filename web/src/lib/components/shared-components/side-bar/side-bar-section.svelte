<script lang="ts">
	import { onMount } from 'svelte';

	export let isCollapsed = true;
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
	on:mouseover={() => (innerWidth >= 430 ? (isCollapsed = false) : null)}
	on:focus={() => (innerWidth >= 430 ? (isCollapsed = false) : null)}
	on:mouseleave={() => handleResize()}
	class="flex flex-col gap-1 pt-8 bg-immich-bg dark:bg-immich-dark-bg transition-[width] duration-200 z-10 {isCollapsed
		? 'w-[72px]'
		: 'pr-6 w-64 shadow-2xl md:shadow-none md:border-none border-r dark:border-r-immich-dark-gray'}"
>
	<slot />
</section>
