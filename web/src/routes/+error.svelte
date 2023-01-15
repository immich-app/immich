<script>
	import { page } from '$app/stores';
	import Message from 'svelte-material-icons/Message.svelte';
	import PartyPopper from 'svelte-material-icons/PartyPopper.svelte';
	import CodeTags from 'svelte-material-icons/CodeTags.svelte';
	import ContentCopy from 'svelte-material-icons/ContentCopy.svelte';
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { handleError } from '$lib/utils/handle-error';

	const handleCopy = async () => {
		//
		const error = $page.error || null;
		if (!error) {
			return;
		}

		try {
			await navigator.clipboard.writeText(`${error.message} - ${error.code}\n${error.stack}`);
			notificationController.show({
				type: NotificationType.Info,
				message: 'Copied error to clipboard'
			});
		} catch (error) {
			handleError(error, 'Unable to copy to clipboard');
		}
	};
</script>

<div class="h-screen w-screen">
	<section class="bg-immich-bg dark:bg-immich-dark-bg">
		<div class="flex border-b dark:border-b-immich-dark-gray place-items-center px-6 py-4">
			<a class="flex gap-2 place-items-center hover:cursor-pointer" href="/photos">
				<img src="/immich-logo.svg" alt="immich logo" height="35" width="35" draggable="false" />
				<h1 class="font-immich-title text-2xl text-immich-primary dark:text-immich-dark-primary">
					IMMICH
				</h1>
			</a>
		</div>
	</section>

	<div
		class="fixed top-0 w-full h-full  bg-black/50 flex place-items-center place-content-center overflow-hidden"
	>
		<div>
			<div
				class="border bg-immich-bg dark:bg-immich-dark-gray dark:border-immich-dark-gray shadow-sm w-[500px] max-w-[95vw] rounded-3xl dark:text-immich-dark-fg"
			>
				<div>
					<div class="flex items-center justify-between gap-4 px-4 py-4">
						<h1 class="text-immich-primary dark:text-immich-dark-primary font-medium">
							🚨 Error - Something went wrong
						</h1>
						<div class="flex justify-end">
							<button
								on:click={() => handleCopy()}
								class="transition-colors bg-immich-primary dark:bg-immich-dark-primary hover:bg-immich-primary/75 dark:hover:bg-immich-dark-primary/80 dark:text-immich-dark-gray px-3 py-2 text-white rounded-full shadow-md text-sm"
							>
								<ContentCopy size={24} />
							</button>
						</div>
					</div>

					<hr />

					<div class="p-4 max-h-[75vh] min-h-[300px] overflow-y-auto immich-scrollbar pb-4 gap-4">
						<div class="flex flex-col w-full gap-2">
							<p class="text-red-500">{$page.error?.message} - {$page.error?.code}</p>
							{#if $page.error?.stack}
								<label for="stacktrace">Stacktrace</label>
								<pre id="stacktrace" class="text-xs">{$page.error?.stack || 'No stack'}</pre>
							{/if}
						</div>
					</div>

					<hr />

					<div class="flex justify-around place-items-center place-content-center">
						<!-- href="https://github.com/immich-app/immich/issues/new" -->
						<a
							href="https://discord.com/invite/D8JsnBEuKb"
							target="_blank"
							rel="noopener noreferrer"
							class="flex justify-center grow basis-0 p-4"
						>
							<button class="flex flex-col gap-2 place-items-center place-content-center">
								<Message size={24} />
								<p class="text-sm">Get Help</p>
							</button>
						</a>

						<a
							href="https://github.com/immich-app/immich/releases"
							target="_blank"
							rel="noopener noreferrer"
							class="flex justify-center grow basis-0 p-4"
						>
							<button class="flex flex-col gap-2 place-items-center place-content-center">
								<PartyPopper size={24} />
								<p class="text-sm">Read Changelog</p>
							</button>
						</a>

						<a
							href="https://immich.app/docs/guides/docker-help"
							target="_blank"
							rel="noopener noreferrer"
							class="flex justify-center grow basis-0 p-4"
						>
							<button class="flex flex-col gap-2 place-items-center place-content-center">
								<CodeTags size={24} />
								<p class="text-sm">Check Logs</p>
							</button>
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
