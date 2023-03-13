<script lang="ts">
	import { ServerStatsResponseDto } from '@api';
	import CameraIris from 'svelte-material-icons/CameraIris.svelte';
	import PlayCircle from 'svelte-material-icons/PlayCircle.svelte';
	import Memory from 'svelte-material-icons/Memory.svelte';
	import StatsCard from './stats-card.svelte';
	import { asByteUnitString, getBytesWithUnit } from '../../../utils/byte-units';
	import { locale } from '$lib/stores/preferences.store';

	export let stats: ServerStatsResponseDto = {
		photos: 0,
		videos: 0,
		usage: 0,
		usageByUser: []
	};

	$: [statsUsage, statsUsageUnit] = getBytesWithUnit(stats.usage, 0);
</script>

<div class="flex flex-col gap-5">
	<div>
		<p class="text-sm dark:text-immich-dark-fg">TOTAL USAGE</p>

		<div class="flex mt-5 justify-between">
			<StatsCard logo={CameraIris} title="PHOTOS" value={stats.photos} />
			<StatsCard logo={PlayCircle} title="VIDEOS" value={stats.videos} />
			<StatsCard logo={Memory} title="STORAGE" value={statsUsage} unit={statsUsageUnit} />
		</div>
	</div>

	<div>
		<p class="text-sm dark:text-immich-dark-fg">USER USAGE DETAIL</p>
		<table class="text-left w-full mt-5">
			<thead
				class="border rounded-md mb-4 bg-gray-50 dark:bg-immich-dark-gray dark:border-immich-dark-gray flex text-immich-primary dark:text-immich-dark-primary  w-full h-12"
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
