<script lang="ts">
	import SelectionSearch from 'svelte-material-icons/SelectionSearch.svelte';
	import Play from 'svelte-material-icons/Play.svelte';
	import Pause from 'svelte-material-icons/Pause.svelte';
	import FastForward from 'svelte-material-icons/FastForward.svelte';
	import AllInclusive from 'svelte-material-icons/AllInclusive.svelte';
	import { locale } from '$lib/stores/preferences.store';
	import { createEventDispatcher } from 'svelte';
	import { JobCommand, JobCommandDto, JobCountsDto } from '@api';
	import Badge from '$lib/components/elements/badge.svelte';

	export let title: string;
	export let subtitle: string | undefined = undefined;
	export let jobCounts: JobCountsDto;
	export let allowForceCommand = true;

	$: isRunning = jobCounts.active > 0 || jobCounts.waiting > 0;
	$: waitingCount = jobCounts.waiting + jobCounts.paused;
	$: isPause = jobCounts.paused > 0;

	const dispatch = createEventDispatcher<{ command: JobCommandDto }>();
</script>

<div
	class="flex justify-between rounded-3xl bg-gray-100 dark:bg-immich-dark-gray transition-all
  {isRunning ? 'dark:bg-immich-primary/30 bg-immich-primary/20' : ''} 
  {isPause ? 'dark:bg-yellow-100/30 bg-yellow-500/20' : ''}"
>
	<div id="job-info" class="w-full p-9">
		<div class="flex flex-col gap-2 ">
			<div
				class="flex items-center gap-4 text-xl font-semibold text-immich-primary dark:text-immich-dark-primary"
			>
				<span>{title.toUpperCase()}</span>
				<div class="flex gap-2">
					{#if jobCounts.failed > 0}
						<Badge color="danger">
							{jobCounts.failed.toLocaleString($locale)} failed
						</Badge>
					{/if}
				</div>
			</div>

			{#if subtitle}
				<div class="text-sm dark:text-white whitespace-pre-line">{subtitle}</div>
			{/if}
			<div class="text-sm dark:text-white">
				<slot />
			</div>

			<div class="flex w-full max-w-md mt-2">
				<div
					class="flex place-items-center justify-between bg-immich-primary dark:bg-immich-dark-primary text-white dark:text-immich-dark-gray w-full rounded-tl-lg rounded-bl-lg py-4 pl-4 pr-6"
				>
					<p>Active</p>
					<p class="text-2xl">
						{jobCounts.active.toLocaleString($locale)}
					</p>
				</div>

				<div
					class="flex place-items-center justify-between bg-gray-200 text-immich-dark-bg dark:bg-gray-700 dark:text-immich-gray w-full rounded-tr-lg rounded-br-lg py-4 pr-4 pl-6"
				>
					<p class="text-2xl">
						{waitingCount.toLocaleString($locale)}
					</p>
					<p>Waiting</p>
				</div>
			</div>
		</div>
	</div>
	<div id="job-action" class="flex flex-col rounded-r-3xl w-32 overflow-hidden">
		{#if isRunning}
			<button
				class="job-play-button bg-gray-300/90 dark:bg-gray-600/90"
				on:click={() => dispatch('command', { command: JobCommand.Pause, force: false })}
			>
				<Pause size="48" /> PAUSE
			</button>
		{:else if jobCounts.paused > 0}
			<button
				class="job-play-button bg-gray-300 dark:bg-gray-600/90"
				on:click={() => dispatch('command', { command: JobCommand.Resume, force: false })}
			>
				<span class=" {isPause ? 'animate-pulse' : ''}">
					<FastForward size="48" /> RESUME
				</span>
			</button>
		{:else if allowForceCommand}
			<button
				class="job-play-button bg-gray-300 dark:bg-gray-600"
				on:click={() => dispatch('command', { command: JobCommand.Start, force: true })}
			>
				<AllInclusive size="18" /> ALL
			</button>
			<button
				class="job-play-button bg-gray-300/90 dark:bg-gray-600/90"
				on:click={() => dispatch('command', { command: JobCommand.Start, force: false })}
			>
				<SelectionSearch size="18" /> MISSING
			</button>
		{:else}
			<button
				class="job-play-button bg-gray-300/90 dark:bg-gray-600/90"
				on:click={() => dispatch('command', { command: JobCommand.Start, force: false })}
			>
				<Play size="48" /> START
			</button>
		{/if}
	</div>
</div>
