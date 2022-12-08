<script lang="ts">
	import SettingsAccordion from '$lib/components/admin-page/settings/settings-accordion.svelte';
	import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
	import { api, SystemConfigDto } from '@api';
	import type { PageData } from './$types';

	export let data: PageData;

	let systemConfig: SystemConfigDto;

	const getConfig = async () => {
		const { data } = await api.systemConfigApi.getConfig();
		systemConfig = data;

		return data;
	};
</script>

<section class="">
	{#await getConfig()}
		<LoadingSpinner />
	{:then configs}
		<SettingsAccordion
			title="FFmpeg Settings"
			subtitle="Manage the resolution and encoding information of the video files"
		>
			{#each Object.entries(configs.ffmpeg) as config}
				{@const [ffmpegKey, ffmpegValue] = config}
				<div class="flex flex-col">
					{ffmpegKey} - {ffmpegValue}
				</div>
			{/each}
		</SettingsAccordion>

		<SettingsAccordion title="OAuth Settings" subtitle="Manage the OAuth integration to Immich app">
			{#each Object.entries(configs.oauth) as config}
				{@const [oauthKey, oauthValue] = config}
				<div class="flex flex-col">
					{oauthKey} - {oauthValue}
				</div>
			{/each}
		</SettingsAccordion>
	{/await}
</section>
