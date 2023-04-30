<script lang="ts">
	import { api } from '@api';
	import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
	import Button from '../elements/buttons/button.svelte';
	import { createEventDispatcher, onMount } from 'svelte';

	export let personName = '';
	export let personId = '';
	let dispatch = createEventDispatcher();
	let inputElement: HTMLInputElement;

	onMount(() => {
		if (inputElement) {
			inputElement.focus();
		}
	});

	const handleNameChange = () => {
		console.log('name changed', personName);
		dispatch('name-changed', personName);
	};
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
	<div class="ml-4 flex justify-between w-full gap-16">
		<input
			class="gap-2 w-full bg-gray-100 dark:bg-gray-700 dark:text-white"
			type="text"
			placeholder="New name or nickname"
			bind:value={personName}
			bind:this={inputElement}
		/>
		<Button size="sm" on:click={handleNameChange}>Done</Button>
	</div>
</div>
