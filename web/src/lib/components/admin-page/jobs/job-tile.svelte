<script lang="ts">
	import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
	import { createEventDispatcher } from 'svelte';
	import { JobCounts } from '@api';

	export let title: string;
	export let subtitle: string;
	export let buttonTitle = 'Run';
	export let jobCounts: JobCounts;

	const dispatch = createEventDispatcher();
</script>

<div class="flex border-b pb-5 dark:border-b-immich-dark-gray">
	<div class="w-[70%]">
		<h1 class="text-immich-primary dark:text-immich-dark-primary text-sm font-semibold">
			{title.toUpperCase()}
		</h1>
		<p class="text-sm mt-1 dark:text-immich-dark-fg">{subtitle}</p>
		<p class="text-sm dark:text-immich-dark-fg">
			<slot />
		</p>
		<table class="text-left w-full mt-5">
			<!-- table header -->
			<thead
				class="border rounded-md mb-2 dark:bg-immich-dark-gray dark:border-immich-dark-gray bg-immich-primary/10 flex text-immich-primary dark:text-immich-dark-primary w-full h-12"
			>
				<tr class="flex w-full place-items-center">
					<th class="text-center w-1/3 font-medium text-sm">Status</th>
					<th class="text-center w-1/3 font-medium text-sm">Active</th>
					<th class="text-center w-1/3 font-medium text-sm">Waiting</th>
				</tr>
			</thead>
			<tbody
				class="overflow-y-auto rounded-md w-full max-h-[320px] block border bg-white dark:border-immich-dark-gray dark:bg-immich-dark-gray/75 dark:text-immich-dark-fg"
			>
				<tr class="text-center flex place-items-center w-full h-[60px]">
					<td class="text-sm px-2 w-1/3 text-ellipsis">
						{#if jobCounts}
							<span>{jobCounts.active > 0 || jobCounts.waiting > 0 ? 'Active' : 'Idle'}</span>
						{:else}
							<LoadingSpinner />
						{/if}
					</td>
					<td class="flex justify-center text-sm px-2 w-1/3 text-ellipsis">
						{#if jobCounts.active !== undefined}
							{jobCounts.active}
						{:else}
							<LoadingSpinner />
						{/if}
					</td>
					<td class="flex justify-center text-sm px-2 w-1/3 text-ellipsis">
						{#if jobCounts.waiting !== undefined}
							{jobCounts.waiting}
						{:else}
							<LoadingSpinner />
						{/if}
					</td>
				</tr>
			</tbody>
		</table>
	</div>
	<div class="w-[30%] flex place-items-center place-content-end">
		<button
			on:click={() => dispatch('click')}
			class="px-6 py-3 text-sm bg-immich-primary dark:bg-immich-dark-primary font-medium rounded-2xl hover:bg-immich-primary/50 transition-all hover:cursor-pointer disabled:cursor-not-allowed shadow-sm text-immich-bg dark:text-immich-dark-gray"
			disabled={jobCounts.active > 0 && jobCounts.waiting > 0}
		>
			{#if jobCounts.active > 0 || jobCounts.waiting > 0}
				<LoadingSpinner />
			{:else}
				{buttonTitle}
			{/if}
		</button>
	</div>
</div>
