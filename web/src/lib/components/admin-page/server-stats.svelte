<script lang="ts">
	import { ServerStatsResponseDto } from '@api';
	export let stats: ServerStatsResponseDto;
</script>

<div class="border p-6 rounded-2xl bg-white">
	<pre>{JSON.stringify(stats, null, 2)}</pre>
</div>
