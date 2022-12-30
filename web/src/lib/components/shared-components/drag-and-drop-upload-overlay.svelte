<script lang="ts">
	import { fade } from 'svelte/transition';

	export let dropHandler: (event: DragEvent) => void;
	export let dragOverHandler: (event: DragEvent) => void;
	export let dragLeaveHandler: () => void;
</script>

<div
	in:fade={{ duration: 250 }}
	out:fade={{ duration: 250 }}
	on:drop={dropHandler}
	on:dragover={dragOverHandler}
	on:dragleave={dragLeaveHandler}
	class="fixed inset-0 w-full h-full z-[1000] flex flex-col items-center justify-center bg-gray-100/90 dark:bg-immich-dark-bg/90 text-immich-dark-gray dark:text-immich-gray"
>
	<img
		src="/immich-logo.svg"
		alt="immich logo"
		height="200"
		width="200"
		class="animate-bounce pb-16"
	/>
	<div class="text-2xl">Drop files anywhere to upload</div>
</div>
