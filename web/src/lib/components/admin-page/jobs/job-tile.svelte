<script lang="ts">
	import SelectionSearch from 'svelte-material-icons/SelectionSearch.svelte';
	import Play from 'svelte-material-icons/Play.svelte';
	import Pause from 'svelte-material-icons/Pause.svelte';
	import FastForward from 'svelte-material-icons/FastForward.svelte';
	import AllInclusive from 'svelte-material-icons/AllInclusive.svelte';
	import Close from 'svelte-material-icons/Close.svelte';
	import { locale } from '$lib/stores/preferences.store';
	import { createEventDispatcher } from 'svelte';
	import { JobCommand, JobCommandDto, JobCountsDto, QueueStatusDto } from '@api';
	import Badge from '$lib/components/elements/badge.svelte';
	import JobTileButton from './job-tile-button.svelte';

	export let title: string;
	export let subtitle: string | undefined = undefined;
	export let jobCounts: JobCountsDto;
	export let queueStatus: QueueStatusDto;
	export let allowForceCommand = true;

	$: waitingCount = jobCounts.waiting + jobCounts.paused + jobCounts.delayed;

	const dispatch = createEventDispatcher<{ command: JobCommandDto }>();
</script>

<div
	class="flex justify-between rounded-3xl transition-colors {(() => {
		if (queueStatus.isPaused) {
			return 'bg-yellow-500/20 dark:bg-yellow-100/30';
		} else if (queueStatus.isActive) {
			return 'bg-immich-primary/20 dark:bg-immich-primary/30';
		}
		return 'bg-gray-100 dark:bg-immich-dark-gray';
	})()}"
>
	<div id="job-info" class="w-full p-9">
		<div class="flex flex-col gap-2">
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
					{#if jobCounts.delayed > 0}
						<Badge color="primary">
							{jobCounts.delayed.toLocaleString($locale)} delayed
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
		{#if queueStatus.isActive || queueStatus.isPaused}
			{#if waitingCount > 0}
				<JobTileButton
					color="gray"
					on:click={() => dispatch('command', { command: JobCommand.Empty, force: false })}
				>
					<Close size="28" /> CLEAR
				</JobTileButton>
			{/if}
			{#if queueStatus.isPaused}
				<JobTileButton
					color="light-gray"
					on:click={() => dispatch('command', { command: JobCommand.Resume, force: false })}
				>
					{@const size = waitingCount > 0 ? '28' : '48'}

					<!-- size property is not reactive, so have to use width and height -->
					<FastForward width={size} height={size} /> RESUME
				</JobTileButton>
			{:else}
				<JobTileButton
					color="light-gray"
					on:click={() => dispatch('command', { command: JobCommand.Pause, force: false })}
				>
					<Pause size="28" /> PAUSE
				</JobTileButton>
			{/if}
		{:else if allowForceCommand}
			<JobTileButton
				color="gray"
				on:click={() => dispatch('command', { command: JobCommand.Start, force: true })}
			>
				<AllInclusive size="28" /> ALL
			</JobTileButton>
			<JobTileButton
				color="light-gray"
				on:click={() => dispatch('command', { command: JobCommand.Start, force: false })}
			>
				<SelectionSearch size="28" /> MISSING
			</JobTileButton>
		{:else}
			<JobTileButton
				color="light-gray"
				on:click={() => dispatch('command', { command: JobCommand.Start, force: false })}
			>
				<Play size="48" /> START
			</JobTileButton>
		{/if}
	</div>
</div>
