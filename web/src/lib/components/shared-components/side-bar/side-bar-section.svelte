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
	on:mouseover={() => (innerWidth >= 430 ? (isCollapsed = false) : null)}
	on:focus={() => (innerWidth >= 430 ? (isCollapsed = false) : null)}
	on:mouseleave={() => handleResize()}
	class="flex flex-col gap-1 pt-8 bg-immich-bg dark:bg-immich-dark-bg transition-[width] duration-200 z-10 max-xs:w-[72px] {isCollapsed
		? 'w-[72px]'
		: 'xs:pr-6 xs:w-64 xs:shadow-2xl md:shadow-none md:border-none xs:border-r xs:dark:border-r-immich-dark-gray'}"
>
	<slot />
</section>
