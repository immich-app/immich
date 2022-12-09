<script lang="ts" context="module">
	export enum SettingInputFieldType {
		TEXT = 'text',
		NUMBER = 'number',
		PASSWORD = 'password'
	}
</script>

<script lang="ts">
	export let inputType: SettingInputFieldType;
	export let value: string;
	export let label: string;
	export let required = false;
	export let disabled = false;

	const handleInput = (e: Event) => {
		value = (e.target as HTMLInputElement).value;
	};
</script>

<div class="m-4 flex flex-col gap-2">
	<div class="flex justify-items-center gap-1">
		<label class="immich-form-label" for={label}>{label.toUpperCase()}</label>
		{#if required}
			<span class="text-red-400">*</span>
		{/if}
	</div>
	<input
		class="immich-form-input"
		id={label}
		name={label}
		type={inputType}
		{required}
		{value}
		on:input={handleInput}
		{disabled}
	/>
</div>
