<script lang="ts">
	import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
	import { createEventDispatcher } from 'svelte';

	export let title: string;
	export let subtitle: string;
	export let buttonTitle = 'Run';
	export let jobStatus: boolean;
	export let waitingJobCount: number;
	export let activeJobCount: number;
	const dispatch = createEventDispatcher();
</script>

<div class="flex border p-6 rounded-2xl bg-white">
	<div class="w-[70%]">
		<h1 class="font-medium text-immich-primary">{title}</h1>
		<p class="text-sm mt-1 font-medium">{subtitle}</p>
		<p class="text-sm">
			<slot />
		</p>
		<table class="text-left w-full mt-4">
			<!-- table header -->
			<thead class="border rounded-md mb-2 bg-gray-50 flex text-immich-primary w-full h-12">
				<tr class="flex w-full place-items-center">
					<th class="text-center w-1/3 font-medium text-sm">Status</th>
					<th class="text-center w-1/3 font-medium text-sm">Active</th>
					<th class="text-center w-1/3 font-medium text-sm">Waiting</th>
				</tr>
			</thead>
			<tbody class="overflow-y-auto rounded-md w-full max-h-[320px] block border">
				<tr class="text-center flex place-items-center w-full h-[40px]">
					<td class="text-sm px-2 w-1/3 text-ellipsis">{jobStatus ? 'Active' : 'Idle'}</td>
					<td class="text-sm px-2 w-1/3 text-ellipsis">{activeJobCount}</td>
					<td class="text-sm px-2 w-1/3 text-ellipsis">{waitingJobCount}</td>
				</tr>
			</tbody>
		</table>
	</div>
	<div class="w-[30%] flex place-items-center place-content-end">
		<button
			on:click={() => dispatch('click')}
			class="border px-6 py-3 text-sm bg-gray-50 font-medium rounded-2xl hover:bg-immich-primary/10 transition-all hover:cursor-pointer disabled:cursor-not-allowed"
			disabled={jobStatus}
		>
			{#if jobStatus}
				<LoadingSpinner />
			{:else}
				{buttonTitle}
			{/if}
		</button>
	</div>
</div>
