<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import Cloud from 'svelte-material-icons/Cloud.svelte';
	import Dns from 'svelte-material-icons/Dns.svelte';
	import LoadingSpinner from './loading-spinner.svelte';
	import { api, ServerInfoResponseDto } from '@api';

	let isServerOk = true;
	let serverVersion = '';
	let serverInfo: ServerInfoResponseDto;

	onMount(async () => {
		try {
			const { data: version } = await api.serverInfoApi.getServerVersion();

			serverVersion = `v${version.major}.${version.minor}.${version.patch}`;

			const { data: serverInfoRes } = await api.serverInfoApi.getServerInfo();
			serverInfo = serverInfoRes;
			getStorageUsagePercentage();
		} catch (e) {
			console.log('Error [StatusBox] [onMount]');
			isServerOk = false;
		}
	});

	const pingServerInterval = setInterval(async () => {
		try {
			const { data: pingReponse } = await api.serverInfoApi.pingServer();

			if (pingReponse.res === 'pong') isServerOk = true;
			else isServerOk = false;

			const { data: serverInfoRes } = await api.serverInfoApi.getServerInfo();
			serverInfo = serverInfoRes;
		} catch (e) {
			console.log('Error [StatusBox] [pingServerInterval]', e);
			isServerOk = false;
		}
	}, 10000);

	onDestroy(() => clearInterval(pingServerInterval));

	const getStorageUsagePercentage = () => {
		return Math.round((serverInfo?.diskUseRaw / serverInfo?.diskSizeRaw) * 100);
	};
</script>

<div>
	<div class="storage-status grid grid-cols-[64px_auto]">
		<div class="pl-5 pr-6 text-immich-primary">
			<Cloud size={'24'} />
		</div>
		<div>
			<p class="text-sm font-medium text-immich-primary">Storage</p>
			{#if serverInfo}
				<div class="w-full bg-gray-200 rounded-full h-[7px] dark:bg-gray-700 my-2">
					<!-- style={`width: ${$downloadAssets[fileName]}%`} -->
					<div
						class="bg-immich-primary h-[7px] rounded-full"
						style={`width: ${getStorageUsagePercentage()}%`}
					/>
				</div>
				<p class="text-xs">{serverInfo?.diskUse} of {serverInfo?.diskSize} used</p>
			{:else}
				<div class="mt-2">
					<LoadingSpinner />
				</div>
			{/if}
		</div>
	</div>
	<div>
		<hr class="ml-5 my-4" />
	</div>
	<div class="server-status grid grid-cols-[64px_auto]">
		<div class="pl-5 pr-6 text-immich-primary">
			<Dns size={'24'} />
		</div>

		<div class="text-xs">
			<p class="text-sm font-medium text-immich-primary">Server</p>

			<div class="flex justify-items-center justify-between mt-2">
				<p>Status</p>

				{#if isServerOk}
					<p class="font-medium text-immich-primary">Online</p>
				{:else}
					<p class="font-medium text-red-500">Offline</p>
				{/if}
			</div>

			<div class="flex justify-items-center justify-between mt-2">
				<p>Version</p>
				<p class="font-medium text-immich-primary">{serverVersion}</p>
			</div>
		</div>
	</div>
	<!-- <div>
		<hr class="ml-5 my-4" />
	</div>
	<button class="text-xs ml-5 underline hover:cursor-pointer text-immich-primary" on:click={() => goto('/changelog')}
		>Changelog</button
	> -->
</div>
