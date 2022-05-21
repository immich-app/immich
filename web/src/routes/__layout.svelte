<script lang="ts">
	import { getRequest } from '$lib/api';
	import { onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import '../app.css';
	import { serverEndpoint } from '../lib/constants';

	let endpoint = serverEndpoint;
	let isServerOk = true;

	const pingServerInterval = setInterval(async () => {
		const response = await getRequest('server-info/ping', '');

		if (response.res === 'pong') isServerOk = true;
		if (response.statusCode === 404) isServerOk = false;
	}, 10000);

	onDestroy(() => clearInterval(pingServerInterval));
</script>

<main>
	<slot />
</main>

<footer
	class="text-sm fixed bottom-0 h-8 flex place-items-center place-content-center bg-gray-50 w-screen font-mono gap-8 px-4 font-medium"
>
	<p class="">
		Server URL <span class="text-immich-primary font-bold">{endpoint}</span>
	</p>
	<p class="">
		Server Status
		{#if isServerOk}
			<span class="text-immich-primary font-bold">OK</span>
		{:else}
			<span class="text-red-500 font-bold">OFFLINE</span>
		{/if}
	</p>
</footer>
