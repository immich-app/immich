<script lang="ts">
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

<div class="w-[180px] h-[140px] bg-immich-gray rounded-3xl p-5 flex flex-col justify-between">
	<div class="flex place-items-center gap-4">
		<svelte:component this={logo} size="40" color={'#4250af'} />
		<p class="text-immich-primary">{title}</p>
	</div>

	<div class="relative text-center font-mono font-semibold text-2xl">
		<span class="text-[#DCDADA]">{zeros()}</span><span class="text-immich-primary"
			>{parseInt(value)}</span
		>
		{#if unit}
			<span class="absolute -top-5 right-2 text-base font-light text-gray-400">{unit}</span>
		{/if}
	</div>
</div>
