<script lang="ts">
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export let logo: any;
	export let title: string;
	export let value: string;
	export let unit: string | undefined = undefined;

	$: zeros = () => {
		let result = '';
		const maxLength = 9;
		const valueLength = parseInt(value).toString().length;
		const zeroLength = maxLength - valueLength;
		for (let i = 0; i < zeroLength; i++) {
			result += '0';
		}
		return result;
	};
</script>

<div
	class="w-[180px] h-[140px] bg-immich-gray dark:bg-immich-dark-gray rounded-3xl p-5 flex flex-col justify-between"
>
	<div class="flex place-items-center gap-4 text-immich-primary dark:text-immich-dark-primary">
		<svelte:component this={logo} size="40" />
		<p>{title}</p>
	</div>

	<div class="relative text-center font-mono font-semibold text-2xl">
		<span class="text-[#DCDADA] dark:text-[#525252]">{zeros()}</span><span
			class="text-immich-primary dark:text-immich-dark-primary">{parseInt(value)}</span
		>
		{#if unit}
			<span class="absolute -top-5 right-2 text-base font-light text-gray-400">{unit}</span>
		{/if}
	</div>
</div>
