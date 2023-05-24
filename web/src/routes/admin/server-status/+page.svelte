<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { api } from '@api';
	import ServerStatsPanel from '$lib/components/admin-page/server-stats/server-stats-panel.svelte';
	import type { PageData } from './$types';
	import AdminPageLayout from '$lib/components/layouts/admin-page-layout.svelte';

	export let data: PageData;
	let setIntervalHandler: NodeJS.Timer;

	onMount(async () => {
		setIntervalHandler = setInterval(async () => {
			const { data: stats } = await api.serverInfoApi.getStats();
			data.stats = stats;
		}, 5000);
	});

	onDestroy(() => {
		clearInterval(setIntervalHandler);
	});
</script>

<AdminPageLayout user={data.user} title={data.meta.title}>
	<ServerStatsPanel stats={data.stats} />
</AdminPageLayout>
