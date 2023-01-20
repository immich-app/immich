<script lang="ts">
	import { api, ServerStatsResponseDto, UserResponseDto } from '@api';
	import CameraIris from 'svelte-material-icons/CameraIris.svelte';
	import PlayCircle from 'svelte-material-icons/PlayCircle.svelte';
	import Memory from 'svelte-material-icons/Memory.svelte';
	import StatsCard from './stats-card.svelte';
	import { getBytesWithUnit, asByteUnitString } from '../../../utils/byte-units';
	import { onMount, onDestroy } from 'svelte';
	import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';

	export let allUsers: Array<UserResponseDto>;

	let stats: ServerStatsResponseDto;
	let setIntervalHandler: NodeJS.Timer;

	onMount(async () => {
		const { data } = await api.serverInfoApi.getStats();
		stats = data;

		setIntervalHandler = setInterval(async () => {
			const { data } = await api.serverInfoApi.getStats();
			stats = data;
		}, 5000);
	});

	onDestroy(() => {
		clearInterval(setIntervalHandler);
	});

	const getFullName = (userId: string) => {
		let name = 'Admin'; // since we do not have admin user in allUsers
		allUsers.forEach((user) => {
			if (user.id === userId) name = `${user.firstName} ${user.lastName}`;
		});
		return name;
	};

	// Stats are unavailable if data is not loaded yet
	$: [spaceUsage, spaceUnit] = getBytesWithUnit(stats ? stats.usageRaw : 0);

	const locale = navigator.language;
</script>

<div class="flex flex-col gap-5">
	<div>
		<p class="text-sm dark:text-immich-dark-fg">TOTAL USAGE</p>

		<div class="flex mt-5 justify-between">
			<StatsCard logo={CameraIris} title={'PHOTOS'} value={stats && stats.photos.toString()} />
			<StatsCard logo={PlayCircle} title={'VIDEOS'} value={stats && stats.videos.toString()} />
			<StatsCard
				logo={Memory}
				title={'STORAGE'}
				value={stats && spaceUsage.toString()}
				unit={spaceUnit}
			/>
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
				{#if stats}
					{#each stats.usageByUser as user, i}
						<tr
							class={`text-center flex place-items-center w-full h-[50px] ${
								i % 2 == 0
									? 'bg-immich-gray dark:bg-immich-dark-gray/75'
									: 'bg-immich-bg dark:bg-immich-dark-gray/50'
							}`}
						>
							<td class="text-sm px-2 w-1/4 text-ellipsis">{getFullName(user.userId)}</td>
							<td class="text-sm px-2 w-1/4 text-ellipsis">{user.photos.toLocaleString(locale)}</td>
							<td class="text-sm px-2 w-1/4 text-ellipsis">{user.videos.toLocaleString(locale)}</td>
							<td class="text-sm px-2 w-1/4 text-ellipsis">{asByteUnitString(user.usageRaw)}</td>
						</tr>
					{/each}
				{:else}
					<tr
						class="text-center flex place-items-center w-full h-[50px] bg-immich-gray dark:bg-immich-dark-gray/75"
					>
						<td class="w-full flex justify-center">
							<LoadingSpinner />
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>
