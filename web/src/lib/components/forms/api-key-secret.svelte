<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import KeyVariant from 'svelte-material-icons/KeyVariant.svelte';
	import { handleError } from '../../utils/handle-error';
	import FullScreenModal from '../shared-components/full-screen-modal.svelte';
	import {
		notificationController,
		NotificationType
	} from '../shared-components/notification/notification';
	import Button from '../elements/buttons/button.svelte';

	export let secret = '';

	const dispatch = createEventDispatcher();
	const handleDone = () => dispatch('done');
	let canCopyImagesToClipboard = true;

	onMount(async () => {
		const module = await import('copy-image-clipboard');
		canCopyImagesToClipboard = module.canCopyImagesToClipboard();
	});
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(secret);
			notificationController.show({
				message: 'Copied to clipboard!',
				type: NotificationType.Info
			});
		} catch (error) {
			handleError(error, 'Unable to copy to clipboard');
		}
	};
</script>

<FullScreenModal>
	<div
		class="border bg-immich-bg dark:bg-immich-dark-gray dark:border-immich-dark-gray p-4 shadow-sm w-[500px] max-w-[95vw] rounded-3xl py-8 dark:text-immich-dark-fg"
	>
		<div
			class="flex flex-col place-items-center place-content-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
		>
			<KeyVariant size="4em" />
			<h1 class="text-2xl text-immich-primary dark:text-immich-dark-primary font-medium">
				API Key
			</h1>

			<p class="text-sm dark:text-immich-dark-fg">
				This value will only be shown once. Please be sure to copy it before closing the window.
			</p>
		</div>

		<div class="m-4 flex flex-col gap-2">
			<!-- <label class="immich-form-label" for="email">API Key</label> -->
			<textarea
				class="immich-form-input"
				id="secret"
				name="secret"
				readonly={true}
				value={secret}
			/>
		</div>

		<div class="flex w-full px-4 gap-4 mt-8">
			{#if canCopyImagesToClipboard}
				<Button on:click={() => handleCopy()} fullwidth>Copy to Clipboard</Button>
			{/if}
			<Button on:click={() => handleDone()} fullwidth>Done</Button>
		</div>
	</div>
</FullScreenModal>
