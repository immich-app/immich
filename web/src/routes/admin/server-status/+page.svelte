<script lang="ts">
	import ServerStatsPanel from '$lib/components/admin-page/server-stats/server-stats-panel.svelte';
	import { api, ServerStatsResponseDto } from '@api';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let serverStat: ServerStatsResponseDto;

	onMount(() => {
		getServerStats();
	});

	const getServerStats = async () => {
		try {
			const res = await api.serverInfoApi.getStats();
			serverStat = res.data;
		} catch (e) {
			console.log(e);
		}
	};
</script>

<svelte:head>
	<title>Server Status - Immich</title>
</svelte:head>

{#if $page.data.allUsers && serverStat}
	<ServerStatsPanel stats={serverStat} allUsers={$page.data.allUsers} />
{/if}
