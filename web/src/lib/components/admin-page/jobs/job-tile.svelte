<script lang="ts">
	import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
	import SelectionSearch from 'svelte-material-icons/SelectionSearch.svelte';
	import Play from 'svelte-material-icons/Play.svelte';
	import AllInclusive from 'svelte-material-icons/AllInclusive.svelte';
	import { locale } from '$lib/stores/preferences.store';
	import { createEventDispatcher } from 'svelte';
	import { JobCounts } from '@api';

	export let title: string;
	export let subtitle: string;
	export let jobCounts: JobCounts;
	/**
	 * Show options to run job on all assets of just missing ones
	 */
	export let showOptions = true;

	$: isRunning = jobCounts.active > 0 || jobCounts.waiting > 0;

	const dispatch = createEventDispatcher();

	const run = (includeAllAssets: boolean) => {
		dispatch('click', { includeAllAssets });
	};
</script>

<div class="flex justify-between rounded-3xl bg-gray-100 dark:bg-immich-dark-gray">
	<div id="job-info" class="w-[70%] p-9">
		<div class="flex flex-col gap-2">
			<div class="text-xl font-semibold text-immich-primary dark:text-immich-dark-primary">
				{title.toUpperCase()}
			</div>

			{#if subtitle.length > 0}
				<div class="text-sm dark:text-white">{subtitle}</div>
			{/if}
			<div class="text-sm dark:text-white"><slot /></div>

			<div class="flex w-full mt-4">
				<div
					class="flex place-items-center justify-between bg-immich-primary dark:bg-immich-dark-primary text-white dark:text-immich-dark-gray w-full rounded-tl-lg rounded-bl-lg py-4 pl-4 pr-6"
				>
					<p>Active</p>
					<p class="text-2xl">
						{#if jobCounts.active !== undefined}
							{jobCounts.active.toLocaleString($locale)}
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
							{jobCounts.waiting.toLocaleString($locale)}
						{:else}
							<LoadingSpinner />
						{/if}
					</p>
					<p>Waiting</p>
				</div>
			</div>
		</div>
	</div>
	<div id="job-action" class="flex flex-col">
		{#if isRunning}
			<button
				class="job-play-button bg-gray-300/90 dark:bg-gray-600/90 rounded-br-3xl rounded-tr-3xl disabled:cursor-not-allowed"
				disabled
			>
				<LoadingSpinner />
			</button>
		{/if}

		{#if !isRunning}
			{#if showOptions}
				<button
					class="job-play-button bg-gray-300 dark:bg-gray-600 rounded-tr-3xl"
					on:click={() => run(true)}
				>
					<AllInclusive size="18" /> ALL
				</button>
				<button
					class="job-play-button bg-gray-300/90 dark:bg-gray-600/90 rounded-br-3xl"
					on:click={() => run(false)}
				>
					<SelectionSearch size="18" /> MISSING
				</button>
			{:else}
				<button
					class="job-play-button bg-gray-300/90 dark:bg-gray-600/90 rounded-br-3xl rounded-tr-3xl"
					on:click={() => run(true)}
				>
					<Play size="48" />
				</button>
			{/if}
		{/if}
	</div>
</div>
