<script lang="ts">
	import type Icon from 'svelte-material-icons/AbTesting.svelte';

	export let logo: typeof Icon;
	export let title: string;
	export let value: number;
	export let unit: string | undefined = undefined;

	$: zeros = () => {
		const maxLength = 13;
		const valueLength = value.toString().length;
		const zeroLength = maxLength - valueLength;

		return '0'.repeat(zeroLength);
	};
</script>

<div
	class="w-[250px] h-[140px] bg-immich-gray dark:bg-immich-dark-gray rounded-3xl p-5 flex flex-col justify-between"
>
	<div class="flex place-items-center gap-4 text-immich-primary dark:text-immich-dark-primary">
		<svelte:component this={logo} size="40" />
		<p>{title}</p>
	</div>

	<div class="relative text-center font-mono font-semibold text-2xl">
		<span class="text-[#DCDADA] dark:text-[#525252]">{zeros()}</span><span
			class="text-immich-primary dark:text-immich-dark-primary">{value}</span
		>
		{#if unit}
			<span class="absolute -top-5 right-2 text-base font-light text-gray-400">{unit}</span>
		{/if}
	</div>
</div>
