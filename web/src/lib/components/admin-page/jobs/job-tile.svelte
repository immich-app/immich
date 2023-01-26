<script lang="ts">
	import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
	import PlayOutline from 'svelte-material-icons/PlayOutline.svelte';

	import { createEventDispatcher } from 'svelte';
	import { JobCounts } from '@api';

	export let title: string;
	export let subtitle: string;
	export let buttonTitle = 'Run';
	export let jobCounts: JobCounts;
	export let includeAllAssets = false;
	/**
	 * Show options to run job on all assets of just missing ones
	 */
	export let showOptions = true;

	const dispatch = createEventDispatcher();
</script>

<div class="flex justify-between rounded-xl bg-gray-100 dark:bg-immich-dark-gray">
	<div id="job-info" class="w-[70%] p-7">
		<div class="flex flex-col gap-2">
			<div class="text-xl font-semibold text-immich-primary dark:text-immich-dark-primary">
				{title.toUpperCase()}
			</div>

			{#if subtitle.length > 0}
				<div class="text-sm dark:text-white">{subtitle}</div>
			{/if}
			<div class="text-sm dark:text-white"><slot /></div>

			<div class="flex w-full">
				<div
					class="flex place-items-center justify-between bg-immich-primary dark:bg-immich-dark-primary text-white dark:text-immich-dark-gray w-full rounded-tl-lg rounded-bl-lg py-4 pl-4 pr-6"
				>
					<p>Active</p>
					<p class="text-2xl">
						{#if jobCounts.active !== undefined}
							{jobCounts.active}
						{:else}
							<LoadingSpinner />
						{/if}
					</p>
				</div>

				<div
					class="flex place-items-center justify-between bg-gray-200 text-immich-dark-bg dark:bg-gray-700 dark:text-immich-gray w-full rounded-tr-lg rounded-br-lg py-4 pr-4 pl-6"
				>
					<p class="text-2xl">
						{#if jobCounts.waiting !== undefined}
							{jobCounts.waiting}
						{:else}
							<LoadingSpinner />
						{/if}
					</p>
					<p>Waiting</p>
				</div>
			</div>
		</div>
	</div>
	<div id="job-action" class="flex">
		<button
			class="h-full flex flex-col place-items-center place-content-center px-8 bg-immich-primary dark:bg-immich-dark-primary dark:text-black text-white rounded-tr-xl rounded-br-xl"
		>
			<PlayOutline size="50" />
		</button>
	</div>
</div>
