<script lang="ts">
	import JobsPanel from '$lib/components/admin-page/jobs/jobs-panel.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<JobsPanel jobs={data.jobs} />
