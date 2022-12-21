<script lang="ts">
	import FFmpegSettings from '$lib/components/admin-page/settings/ffmpeg/ffmpeg-settings.svelte';
	import OAuthSettings from '$lib/components/admin-page/settings/oauth/oauth-settings.svelte';
	import SettingAccordion from '$lib/components/admin-page/settings/setting-accordion.svelte';
	import StorageTemplateSettings from '$lib/components/admin-page/settings/storate-template/storage-template-settings.svelte';
	import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
	import { api, SystemConfigDto } from '@api';
	import type { PageData } from './$types';
	import { page } from '$app/stores';

	let systemConfig: SystemConfigDto;
	export let data: PageData;
	const getConfig = async () => {
		const { data } = await api.systemConfigApi.getConfig();
		systemConfig = data;

		return data;
	};
</script>

<svelte:head>
	<title>System Settings - Immich</title>
</svelte:head>

<section class="">
	{#await getConfig()}
		<LoadingSpinner />
	{:then configs}
		<SettingAccordion
			title="FFmpeg Settings"
			subtitle="Manage the resolution and encoding information of the video files"
		>
			<FFmpegSettings ffmpegConfig={configs.ffmpeg} />
		</SettingAccordion>

		<SettingAccordion title="OAuth Settings" subtitle="Manage the OAuth integration to Immich app">
			<OAuthSettings oauthConfig={configs.oauth} />
		</SettingAccordion>

		<SettingAccordion
			title="Storage Template"
			subtitle="Manage the folder structure and file name of the upload asset"
			isOpen={$page.url.searchParams.get('open') === 'storage-template'}
		>
			<StorageTemplateSettings storageConfig={configs.storageTemplate} user={data.user} />
		</SettingAccordion>
	{/await}
</section>
