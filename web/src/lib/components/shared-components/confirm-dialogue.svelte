<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import FullScreenModal from './full-screen-modal.svelte';
	import Button from '../elements/buttons/button.svelte';

	export let title = 'Confirm';
	export let prompt = 'Are you sure you want to do this?';
	export let confirmText = 'Confirm';
	export let cancelText = 'Cancel';

	const dispatch = createEventDispatcher();
	const handleCancel = () => dispatch('cancel');
	const handleConfirm = () => dispatch('confirm');
</script>

<FullScreenModal on:clickOutside={() => handleCancel()}>
	<div
		class="border bg-immich-bg dark:bg-immich-dark-gray dark:border-immich-dark-gray p-4 shadow-sm w-[500px] max-w-[95vw] rounded-3xl py-8 dark:text-immich-dark-fg"
	>
		<div
			class="flex flex-col place-items-center place-content-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
		>
			<h1 class="text-2xl text-immich-primary dark:text-immich-dark-primary font-medium pb-2">
				{title}
			</h1>
		</div>
		<div>
			<slot name="prompt">
				<p class="ml-4 text-md py-5 text-center">{prompt}</p>
			</slot>

			<div class="flex w-full px-4 gap-4 mt-4">
				<Button fullwidth on:click={() => handleCancel()}>{cancelText}</Button>
				<Button color="red" fullwidth on:click={() => handleConfirm()}>{confirmText}</Button>
			</div>
		</div>
	</div>
</FullScreenModal>
