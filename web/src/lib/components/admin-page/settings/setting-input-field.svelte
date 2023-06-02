<script lang="ts" context="module">
	export enum SettingInputFieldType {
		EMAIL = 'email',
		TEXT = 'text',
		NUMBER = 'number',
		PASSWORD = 'password'
	}
</script>

<script lang="ts">
	import { quintOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	export let inputType: SettingInputFieldType;
	export let value: string | number;
	export let label = '';
	export let desc = '';
	export let required = false;
	export let disabled = false;
	export let isEdited = false;

	const handleInput = (e: Event) => {
		value = (e.target as HTMLInputElement).value;
		if (inputType === SettingInputFieldType.NUMBER) {
			value = Number(value) || 0;
		}
	};
</script>

<div class="w-full">
	<div class={`flex place-items-center gap-1 h-[26px]`}>
		<label class={`immich-form-label text-sm`} for={label}>{label}</label>
		{#if required}
			<div class="text-red-400">*</div>
		{/if}

		{#if isEdited}
			<div
				transition:fly={{ x: 10, duration: 200, easing: quintOut }}
				class="bg-orange-100 px-2 rounded-full text-orange-900 text-[10px]"
			>
				Unsaved change
			</div>
		{/if}
	</div>

	{#if desc}
		<p class="immich-form-label text-xs pb-2" id="{label}-desc">
			{desc}
		</p>
	{/if}

	<input
		class="immich-form-input pb-2 w-full"
		aria-describedby={desc ? `${label}-desc` : undefined}
		aria-labelledby="{label}-label"
		id={label}
		name={label}
		type={inputType}
		{required}
		{value}
		on:input={handleInput}
		{disabled}
	/>
</div>
