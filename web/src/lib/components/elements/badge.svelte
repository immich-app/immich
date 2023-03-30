<script lang="ts" context="module">
	export type BadgeColor = 'primary' | 'dark' | 'warning' | 'success' | 'danger';
	export type BadgeRounded = false | true | 'full';
</script>

<script lang="ts">
	export let color: BadgeColor = 'primary';
	export let rounded: BadgeRounded = true;

	const colorClasses: { [Key in BadgeColor]: string } = {
		primary:
			'text-gray-100 dark:text-immich-dark-gray bg-immich-primary dark:bg-immich-dark-primary',
		dark: 'text-neutral-50 dark:text-neutral-50 bg-neutral-900 dark:bg-neutral-900',
		warning: 'text-yellow-900 bg-yellow-200',
		success: 'text-green-900 bg-green-200',
		danger: 'text-red-900 bg-red-200'
	};
</script>

<span
	class="inline-block h-min whitespace-nowrap px-[0.65em] pt-[0.35em] pb-[0.25em] text-center align-baseline text-[0.65em] font-bold leading-none {colorClasses[
		color
	]}"
	class:rounded={rounded === true}
	class:rounded-full={rounded === 'full'}
>
	<slot />
</span>
