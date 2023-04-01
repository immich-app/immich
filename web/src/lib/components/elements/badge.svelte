<script lang="ts" context="module">
	export type Color = 'primary' | 'dark' | 'warning' | 'success' | 'danger';
	export type Rounded = false | true | 'full';
</script>

<script lang="ts">
	export let color: Color = 'primary';
	export let rounded: Rounded = true;

	const colorClasses: Record<Color, string> = {
		primary:
			'text-gray-100 dark:text-immich-dark-gray bg-immich-primary dark:bg-immich-dark-primary',
		dark: 'text-neutral-50 dark:text-neutral-50 bg-neutral-900 dark:bg-neutral-900',
		warning: 'text-yellow-900 bg-yellow-200',
		success: 'text-green-900 bg-green-200',
		danger: 'text-red-900 bg-red-200'
	};
</script>

<span
	class="inline-block h-min whitespace-nowrap px-[0.65em] pt-[0.35em] pb-[0.25em] text-center align-baseline text-[0.75em] font-semibold leading-none {colorClasses[
		color
	]}"
	class:rounded={rounded === true}
	class:rounded-full={rounded === 'full'}
>
	<slot />
</span>
