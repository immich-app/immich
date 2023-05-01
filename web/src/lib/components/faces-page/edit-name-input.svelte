<script lang="ts">
	import { api } from '@api';
	import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
	import Button from '../elements/buttons/button.svelte';
	import { createEventDispatcher, onMount } from 'svelte';

	export let personName = '';
	export let personId = '';
	let dispatch = createEventDispatcher<{ change: string }>();
	let inputElement: HTMLInputElement;

	onMount(() => {
		if (inputElement) {
			inputElement.focus();
		}
	});

	const handleNameChange = () => dispatch('change', personName);
</script>

<div
	class="flex place-items-center w-[500px] rounded-lg border dark:border-transparent p-2 bg-gray-100 dark:bg-gray-700"
>
	<ImageThumbnail
		circle
		shadow
		url={api.getPeopleThumbnailUrl(personId)}
		altText={personName}
		widthStyle="30px"
		heightStyle="30px"
	/>
	<form
		class="ml-4 flex justify-between w-full gap-16"
		autocomplete="off"
		on:submit|preventDefault={handleNameChange}
	>
		<input
			class="gap-2 w-full bg-gray-100 dark:bg-gray-700 dark:text-white"
			type="text"
			placeholder="New name or nickname"
			bind:value={personName}
			bind:this={inputElement}
		/>
		<Button size="sm" type="submit">Done</Button>
	</form>
</div>
