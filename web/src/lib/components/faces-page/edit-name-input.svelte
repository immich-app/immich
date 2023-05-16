<script lang="ts">
	import { PersonResponseDto, api } from '@api';
	import { createEventDispatcher, onMount } from 'svelte';
	import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
	import Button from '../elements/buttons/button.svelte';

	export let person: PersonResponseDto;
	let dispatch = createEventDispatcher<{ change: string }>();
	let inputElement: HTMLInputElement;
	let name = '';

	onMount(() => {
		if (inputElement) {
			inputElement.focus();
		}

		name = person.name;
	});

	const handleNameChange = () => dispatch('change', name);
</script>

<div
	class="flex place-items-center w-[500px] rounded-lg border dark:border-transparent p-2 bg-gray-100 dark:bg-gray-700"
>
	<ImageThumbnail
		circle
		shadow
		url={api.getPeopleThumbnailUrl(person.id)}
		altText={person.name}
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
			bind:value={name}
			bind:this={inputElement}
		/>
		<Button size="sm" type="submit">Done</Button>
	</form>
</div>
