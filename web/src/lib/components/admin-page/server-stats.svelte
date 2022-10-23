<script lang="ts">
	import { ServerStatsResponseDto, UserResponseDto } from '@api';
	export let stats: ServerStatsResponseDto;
	export let allUsers: Array<UserResponseDto>;

	const getFullName = (userId: string) => {
		let name = 'Admin'; // since we do not have admin user in allUsers
		allUsers.forEach((user) => {
			if (user.id === userId) name = `${user.firstName} ${user.lastName}`;
		});
		return name;
	};
</script>

<div class="flex flex-col gap-6">
	<div class="border p-6 rounded-2xl bg-white text-center">
		<h1 class="font-medium text-immich-primary">Server Usage</h1>
		<div class="flex flex-row gap-6 mt-4 font-medium">
			<p class="grow">Photos: {stats.photos}</p>
			<p class="grow">Videos: {stats.videos}</p>
			<p class="grow">Objects: {stats.objects}</p>
			<p class="grow">Size: {stats.usage}</p>
		</div>
	</div>

	<div class="border p-6 rounded-2xl bg-white">
		<h1 class="font-medium text-immich-primary">Usage by User</h1>
		<table class="text-left w-full mt-4">
			<!-- table header -->
			<thead class="border rounded-md mb-2 bg-gray-50 flex text-immich-primary w-full h-12">
				<tr class="flex w-full place-items-center">
					<th class="text-center w-1/5 font-medium text-sm">User</th>
					<th class="text-center w-1/5 font-medium text-sm">Photos</th>
					<th class="text-center w-1/5 font-medium text-sm">Videos</th>
					<th class="text-center w-1/5 font-medium text-sm">Objects</th>
					<th class="text-center w-1/5 font-medium text-sm">Size</th>
				</tr>
			</thead>
			<tbody class="overflow-y-auto rounded-md w-full max-h-[320px] block border">
				{#each stats.usageByUser as user}
					<tr class="text-center flex place-items-center w-full h-[40px]">
						<td class="text-sm px-2 w-1/5 text-ellipsis">{getFullName(user.userId)}</td>
						<td class="text-sm px-2 w-1/5 text-ellipsis">{user.photos}</td>
						<td class="text-sm px-2 w-1/5 text-ellipsis">{user.videos}</td>
						<td class="text-sm px-2 w-1/5 text-ellipsis">{user.objects}</td>
						<td class="text-sm px-2 w-1/5 text-ellipsis">{user.usage}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
