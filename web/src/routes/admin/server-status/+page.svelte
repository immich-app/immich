<script lang="ts">
	import ServerStatsPanel from '$lib/components/admin-page/server-stats/server-stats-panel.svelte';
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>Server Status - Immich</title>
</svelte:head>

{#if $page.data.allUsers}
	<ServerStatsPanel allUsers={$page.data.allUsers} />
{/if}
