<script lang="ts">
	import { APIKeyResponseDto } from '@api';
	import { createEventDispatcher } from 'svelte';
	import KeyVariant from 'svelte-material-icons/KeyVariant.svelte';
	import FullScreenModal from '../shared-components/full-screen-modal.svelte';

	export let apiKey: Partial<APIKeyResponseDto>;
	export let title = 'API Key';
	export let cancelText = 'Cancel';
	export let submitText = 'Save';

	const dispatch = createEventDispatcher();
	const handleCancel = () => dispatch('cancel');
	const handleSubmit = () => dispatch('submit', { ...apiKey, name: apiKey.name });
</script>

<FullScreenModal on:clickOutside={() => handleCancel()}>
	<div
		class="border bg-immich-bg dark:bg-immich-dark-gray dark:border-immich-dark-gray p-4 shadow-sm w-[500px] max-w-[95vw] rounded-3xl py-8 dark:text-immich-dark-fg"
	>
		<div
			class="flex flex-col place-items-center place-content-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
		>
			<KeyVariant size="4em" />
			<h1 class="text-2xl text-immich-primary dark:text-immich-dark-primary font-medium">
				{title}
			</h1>
		</div>

		<form on:submit|preventDefault={() => handleSubmit()} autocomplete="off">
			<div class="m-4 flex flex-col gap-2">
				<label class="immich-form-label" for="email">Name</label>
				<input
					class="immich-form-input"
					id="name"
					name="name"
					type="text"
					bind:value={apiKey.name}
				/>
			</div>

			<div class="flex w-full px-4 gap-4 mt-8">
				<button
					type="button"
					on:click={() => handleCancel()}
					class="flex-1 transition-colors bg-gray-500 dark:bg-gray-200 hover:bg-gray-500/75 dark:hover:bg-gray-200/80 px-6 py-3 text-white dark:text-immich-dark-gray rounded-full shadow-md font-medium"
					>{cancelText}
				</button>
				<button
					type="submit"
					class="flex-1 transition-colors bg-immich-primary dark:bg-immich-dark-primary hover:bg-immich-primary/75 dark:hover:bg-immich-dark-primary/80 dark:text-immich-dark-gray px-6 py-3 text-white rounded-full shadow-md w-full font-medium"
					>{submitText}</button
				>
			</div>
		</form>
	</div>
</FullScreenModal>
