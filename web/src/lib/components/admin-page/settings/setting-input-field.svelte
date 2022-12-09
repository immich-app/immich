<script lang="ts" context="module">
	export enum SettingInputFieldType {
		TEXT = 'text',
		NUMBER = 'number',
		PASSWORD = 'password'
	}
</script>

<script lang="ts">
	import { quintOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	export let inputType: SettingInputFieldType;
	export let value: string;
	export let label: string;
	export let required = false;
	export let disabled = false;
	export let isEdited: boolean;

	const handleInput = (e: Event) => {
		value = (e.target as HTMLInputElement).value;
	};
</script>

<div class="m-4 flex flex-col gap-2">
	<div class="flex place-items-center gap-1">
		<label class="immich-form-label" for={label}>{label.toUpperCase()} </label>
		{#if required}
			<div class="text-red-400">*</div>
		{/if}

		{#if isEdited}
			<div
				transition:fly={{ x: 10, duration: 200, easing: quintOut }}
				class="text-gray-500 text-xs italic"
			>
				Unsaved change
			</div>
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
