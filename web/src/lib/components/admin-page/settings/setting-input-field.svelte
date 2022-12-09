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

	const handleInput = (e: Event) => {
		value = (e.target as HTMLInputElement).value;
	};
</script>

<div class="m-4 flex flex-col gap-2">
	{value}
	<label class="immich-form-label" for={label}>{label.toUpperCase()}</label>
	<input
		class="immich-form-input"
		id={label}
		name={label}
		type={inputType}
		{required}
		{value}
		on:input={handleInput}
	/>
</div>
