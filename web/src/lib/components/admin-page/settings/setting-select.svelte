<script lang="ts">
	import { quintOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	export let value: string;
	export let options: { value: string; text: string }[];
	export let label = '';
	export let desc = '';
	export let name = '';
	export let isEdited = false;

	const handleChange = (e: Event) => {
		value = (e.target as HTMLInputElement).value;
	};
</script>

<div class="w-full">
	<div class={`flex place-items-center gap-1 h-[26px]`}>
		<label class={`immich-form-label text-sm`} for="{name}-select">{label}</label>

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
		<p class="immich-form-label text-xs pb-2" id="{name}-desc">
			{desc}
		</p>
	{/if}

	<select
		class="immich-form-input pb-2 w-full"
		aria-describedby={desc ? `${name}-desc` : undefined}
		{name}
		id="{name}-select"
		bind:value
		on:change={handleChange}
	>
		{#each options as option}
			<option value={option.value}>{option.text}</option>
		{/each}
	</select>
</div>
