<script lang="ts">
	import type Icon from 'svelte-material-icons/AbTesting.svelte';
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
	import JobTileStatus from './job-tile-status.svelte';

	export let title: string;
	export let subtitle: string | undefined = undefined;
	export let jobCounts: JobCountsDto;
	export let queueStatus: QueueStatusDto;
	export let allowForceCommand = true;
	export let icon: typeof Icon;

	export let allText: string;
	export let missingText: string;

	const slots = $$props.$$slots;

	$: waitingCount = jobCounts.waiting + jobCounts.paused + jobCounts.delayed;
	$: isIdle = !queueStatus.isActive && !queueStatus.isPaused;

	const commonClasses = 'flex place-items-center justify-between w-full py-2 sm:py-4 pr-4 pl-6';

	const dispatch = createEventDispatcher<{ command: JobCommandDto }>();
</script>

<div
	class="flex sm:flex-row flex-col bg-gray-100 dark:bg-immich-dark-gray rounded-2xl sm:rounded-[35px] overflow-hidden"
>
	<div class="flex flex-col w-full">
		{#if queueStatus.isPaused}
			<JobTileStatus color="warning">Paused</JobTileStatus>
		{:else if queueStatus.isActive}
			<JobTileStatus color="success">Active</JobTileStatus>
		{/if}
		<div class="flex flex-col gap-2 p-5 sm:p-7 md:p-9">
			<div
				class="flex items-center gap-4 text-xl font-semibold text-immich-primary dark:text-immich-dark-primary"
			>
				<span class="flex gap-2 items-center">
					<svelte:component this={icon} size="1.25em" class="shrink-0 hidden sm:block" />
					{title.toUpperCase()}
				</span>
				<div class="flex gap-2">
					{#if jobCounts.failed > 0}
						<Badge color="primary">
							{jobCounts.failed.toLocaleString($locale)} failed
						</Badge>
					{/if}
					{#if jobCounts.delayed > 0}
						<Badge color="secondary">
							{jobCounts.delayed.toLocaleString($locale)} delayed
						</Badge>
					{/if}
				</div>
			</div>

			{#if subtitle}
				<div class="text-sm dark:text-white whitespace-pre-line">{subtitle}</div>
			{/if}

			{#if slots?.description}
				<div class="text-sm dark:text-white">
					<slot name="description" />
				</div>
			{/if}

			<div class="flex w-full max-w-md mt-2 flex-col sm:flex-row">
				<div
					class="{commonClasses} bg-immich-primary dark:bg-immich-dark-primary text-white dark:text-immich-dark-gray rounded-t-lg sm:rounded-l-lg sm:rounded-r-none"
				>
					<p>Active</p>
					<p class="text-2xl">
						{jobCounts.active.toLocaleString($locale)}
					</p>
				</div>

				<div
					class="{commonClasses} bg-gray-200 text-immich-dark-bg dark:bg-gray-700 dark:text-immich-gray rounded-b-lg sm:rounded-r-lg sm:rounded-l-none flex-row-reverse"
				>
					<p class="text-2xl">
						{waitingCount.toLocaleString($locale)}
					</p>
					<p>Waiting</p>
				</div>
			</div>
		</div>
	</div>
	<div class="flex sm:flex-col flex-row sm:w-32 w-full overflow-hidden">
		{#if !isIdle}
			{#if waitingCount > 0}
				<JobTileButton
					color="gray"
					on:click={() => dispatch('command', { command: JobCommand.Empty, force: false })}
				>
					<Close size="24" /> CLEAR
				</JobTileButton>
			{/if}
			{#if queueStatus.isPaused}
				{@const size = waitingCount > 0 ? '24' : '48'}
				<JobTileButton
					color="light-gray"
					on:click={() => dispatch('command', { command: JobCommand.Resume, force: false })}
				>
					<!-- size property is not reactive, so have to use width and height -->
					<FastForward width={size} height={size} /> RESUME
				</JobTileButton>
			{:else}
				<JobTileButton
					color="light-gray"
					on:click={() => dispatch('command', { command: JobCommand.Pause, force: false })}
				>
					<Pause size="24" /> PAUSE
				</JobTileButton>
			{/if}
		{:else if allowForceCommand}
			<JobTileButton
				color="gray"
				on:click={() => dispatch('command', { command: JobCommand.Start, force: true })}
			>
				<AllInclusive size="24" />
				{allText}
			</JobTileButton>
			<JobTileButton
				color="light-gray"
				on:click={() => dispatch('command', { command: JobCommand.Start, force: false })}
			>
				<SelectionSearch size="24" />
				{missingText}
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
