<script lang="ts">
	import FFmpegSettings from '$lib/components/admin-page/settings/ffmpeg/ffmpeg-settings.svelte';
	import OAuthSettings from '$lib/components/admin-page/settings/oauth/oauth-settings.svelte';
	import SettingsAccordion from '$lib/components/admin-page/settings/settings-accordion.svelte';
	import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
	import { api, SystemConfigDto } from '@api';

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
			<FFmpegSettings ffmpegConfig={configs.ffmpeg} />
		</SettingsAccordion>

		<SettingsAccordion title="OAuth Settings" subtitle="Manage the OAuth integration to Immich app">
			<OAuthSettings oauthConfig={configs.oauth} />
		</SettingsAccordion>
	{/await}
</section>
