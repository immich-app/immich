<script lang="ts">
	import JobsPanel from '$lib/components/admin-page/jobs/jobs-panel.svelte';
	import AdminPageLayout from '$lib/components/layouts/admin-page-layout.svelte';
	import { api } from '@api';
	import { onDestroy, onMount } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	let timer: NodeJS.Timer;

	$: jobs = data.jobs;

	const load = async () => {
		const { data } = await api.jobApi.getAllJobsStatus();
		jobs = data;
	};

	onMount(async () => {
		await load();
		timer = setInterval(load, 5_000);
	});

	onDestroy(() => {
		clearInterval(timer);
	});
</script>

<AdminPageLayout user={data.user} title={data.meta.title}>
	<JobsPanel {jobs} />
</AdminPageLayout>
