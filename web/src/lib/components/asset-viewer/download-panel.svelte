<script lang="ts">
	import { downloadAssets, isDownloading } from '$lib/stores/download';
	import { fly, slide } from 'svelte/transition';
</script>

{#if $isDownloading}
	<div
		transition:fly={{ x: -100, duration: 350 }}
		class="w-[315px] max-h-[270px] bg-immich-bg border rounded-2xl shadow-sm absolute bottom-10 left-2 p-4 z-[10000] text-sm"
	>
		<p class="text-gray-500 text-xs mb-2">DOWNLOADING</p>
		<div class="max-h-[200px] my-2 overflow-y-auto mb-2 flex flex-col text-sm">
			{#each Object.keys($downloadAssets) as fileName}
				<div class="mb-2" transition:slide>
					<p class="font-medium text-xs truncate">■ {fileName}</p>
					<div class="flex flex-row-reverse place-items-center gap-5">
						<p><span class="text-immich-primary font-medium">{$downloadAssets[fileName]}</span>/100</p>
						<div class="w-full bg-gray-200 rounded-full h-[7px] dark:bg-gray-700">
							<div class="bg-immich-primary h-[7px] rounded-full" style={`width: ${$downloadAssets[fileName]}%`} />
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}
