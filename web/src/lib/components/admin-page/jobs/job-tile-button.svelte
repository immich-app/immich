<script lang="ts" context="module">
	export type Colors = 'light-gray' | 'gray';
</script>

<script lang="ts">
	export let color: Colors;

	const colorClasses: Record<Colors, string> = {
		'light-gray': 'bg-gray-300/90 dark:bg-gray-600/90',
		gray: 'bg-gray-300 dark:bg-gray-600'
	};
</script>

<button
	class="h-full w-full py-2 flex gap-2 flex-col place-items-center place-content-center px-8 text-gray-600 transition-colors hover:bg-immich-primary hover:text-white dark:text-gray-200 dark:hover:bg-immich-dark-primary text-xs dark:hover:text-black {colorClasses[
		color
	]}"
	on:click
>
	<slot />
</button>
