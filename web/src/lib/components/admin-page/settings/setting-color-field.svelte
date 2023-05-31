<script lang="ts">
	export let value: string;
	export let label = '';

	const handleInput = (e: Event) => {
		value = (e.target as HTMLInputElement).value;
	};
</script>

<div class="w-full">
	<div class={`flex place-items-center gap-1 h-[26px]`}>
		<label class={`immich-form-label text-sm`} for={label}>{label}</label>
	</div>
	<input
		aria-labelledby="{label}-label"
		id={label}
		name={label}
		type="color"
		class="{value
			? ''
			: 'none'} bg-slate-200 rounded-xl p-2 w-full focus:border-immich-primary text-sm dark:bg-gray-600"
		{value}
		on:input={handleInput}
	/>
</div>

<style scoped>
	input[type='color']::-webkit-color-swatch,
	input[type='color']::-moz-color-swatch {
		border: none;
		border-radius: 5px;
		padding: 0;
	}

	input[type='color'].none::-webkit-color-swatch,
	input[type='color'].none::-moz-color-swatch {
		background-color: transparent !important;
	}
</style>
