<script lang="ts" context="module">
	export type Color = 'success' | 'warning';
</script>

<script lang="ts">
	export let color: Color;

	const colorClasses: Record<Color, string> = {
		success: 'bg-lime-600/70 text-gray-900 dark:bg-green-700/90 dark:text-gray-100',
		warning: 'bg-orange-600/70 text-gray-900 dark:bg-orange-700/90 dark:text-gray-100'
	};
</script>

<div
	class="w-full min-h-8 rounded-t-3xl text-center text-sm font-semibold p-1 {colorClasses[color]}"
>
	<slot />
</div>
