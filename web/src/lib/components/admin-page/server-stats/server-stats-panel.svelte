<script lang="ts">
	import { locale } from '$lib/stores/preferences.store';
	import type { ServerStatsResponseDto } from '@api';
	import CameraIris from 'svelte-material-icons/CameraIris.svelte';
	import Memory from 'svelte-material-icons/Memory.svelte';
	import PlayCircle from 'svelte-material-icons/PlayCircle.svelte';
	import { asByteUnitString, getBytesWithUnit } from '../../../utils/byte-units';
	import StatsCard from './stats-card.svelte';

	export let stats: ServerStatsResponseDto = {
		photos: 0,
		videos: 0,
		usage: 0,
		usageByUser: []
	};

	$: zeros = (value: number) => {
		const maxLength = 13;
		const valueLength = value.toString().length;
		const zeroLength = maxLength - valueLength;

		return '0'.repeat(zeroLength);
	};

	$: [statsUsage, statsUsageUnit] = getBytesWithUnit(stats.usage, 0);
</script>

<div class="flex flex-col gap-5">
	<div>
		<p class="text-sm dark:text-immich-dark-fg">TOTAL USAGE</p>

		<div class="mt-5 justify-between lg:flex hidden">
			<StatsCard logo={CameraIris} title="PHOTOS" value={stats.photos} />
			<StatsCard logo={PlayCircle} title="VIDEOS" value={stats.videos} />
			<StatsCard logo={Memory} title="STORAGE" value={statsUsage} unit={statsUsageUnit} />
		</div>
		<div class="mt-5 lg:hidden flex">
			<div
				class="bg-immich-gray dark:bg-immich-dark-gray rounded-3xl p-5 flex flex-col justify-between"
			>
				<div class="flex flex-wrap gap-x-12">
					<div
						class="flex place-items-center gap-4 text-immich-primary dark:text-immich-dark-primary"
					>
						<CameraIris size="25" />
						<p>PHOTOS</p>
					</div>

					<div class="relative text-center font-mono font-semibold text-2xl">
						<span class="text-[#DCDADA] dark:text-[#525252]">{zeros(stats.photos)}</span><span
							class="text-immich-primary dark:text-immich-dark-primary">{stats.photos}</span
						>
					</div>
				</div>
				<div class="flex flex-wrap gap-x-12">
					<div
						class="flex place-items-center gap-4 text-immich-primary dark:text-immich-dark-primary"
					>
						<PlayCircle size="25" />
						<p>VIDEOS</p>
					</div>

					<div class="relative text-center font-mono font-semibold text-2xl">
						<span class="text-[#DCDADA] dark:text-[#525252]">{zeros(stats.videos)}</span><span
							class="text-immich-primary dark:text-immich-dark-primary">{stats.videos}</span
						>
					</div>
				</div>
				<div class="flex flex-wrap gap-x-7">
					<div
						class="flex place-items-center gap-4 text-immich-primary dark:text-immich-dark-primary"
					>
						<Memory size="25" />
						<p>STORAGE</p>
					</div>

					<div class="relative text-center font-mono font-semibold text-2xl flex">
						<span class="text-[#DCDADA] dark:text-[#525252]">{zeros(statsUsage)}</span><span
							class="text-immich-primary dark:text-immich-dark-primary">{statsUsage}</span
						>
						<span class="text-center my-auto ml-2 text-base font-light text-gray-400"
							>{statsUsageUnit}</span
						>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div>
		<p class="text-sm dark:text-immich-dark-fg">USER USAGE DETAIL</p>
		<table class="text-left w-full mt-5">
			<thead
				class="border rounded-md mb-4 bg-gray-50 dark:bg-immich-dark-gray dark:border-immich-dark-gray flex text-immich-primary dark:text-immich-dark-primary w-full h-12"
			>
				<tr class="flex w-full place-items-center">
					<th class="text-center w-1/4 font-medium text-sm">User</th>
					<th class="text-center w-1/4 font-medium text-sm">Photos</th>
					<th class="text-center w-1/4 font-medium text-sm">Videos</th>
					<th class="text-center w-1/4 font-medium text-sm">Size</th>
				</tr>
			</thead>
			<tbody
				class="overflow-y-auto rounded-md w-full max-h-[320px] block border dark:border-immich-dark-gray dark:text-immich-dark-fg"
			>
				{#each stats.usageByUser as user (user.userId)}
					<tr
						class="text-center flex place-items-center w-full h-[50px] even:bg-immich-bg even:dark:bg-immich-dark-gray/50 odd:bg-immich-gray odd:dark:bg-immich-dark-gray/75"
					>
						<td class="text-sm px-2 w-1/4 text-ellipsis"
							>{user.userFirstName} {user.userLastName}</td
						>
						<td class="text-sm px-2 w-1/4 text-ellipsis">{user.photos.toLocaleString($locale)}</td>
						<td class="text-sm px-2 w-1/4 text-ellipsis">{user.videos.toLocaleString($locale)}</td>
						<td class="text-sm px-2 w-1/4 text-ellipsis">{asByteUnitString(user.usage, $locale)}</td
						>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
