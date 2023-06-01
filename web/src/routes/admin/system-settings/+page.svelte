<script lang="ts">
	import { page } from '$app/stores';
	import FFmpegSettings from '$lib/components/admin-page/settings/ffmpeg/ffmpeg-settings.svelte';
	import JobSettings from '$lib/components/admin-page/settings/job-settings/job-settings.svelte';
	import OAuthSettings from '$lib/components/admin-page/settings/oauth/oauth-settings.svelte';
	import PasswordLoginSettings from '$lib/components/admin-page/settings/password-login/password-login-settings.svelte';
	import SettingAccordion from '$lib/components/admin-page/settings/setting-accordion.svelte';
	import StorageTemplateSettings from '$lib/components/admin-page/settings/storage-template/storage-template-settings.svelte';
	import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
	import { api } from '@api';
	import type { PageData } from './$types';

	export let data: PageData;

	const getConfig = async () => {
		const { data } = await api.systemConfigApi.getConfig();
		return data;
	};
</script>

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

		<SettingAccordion
			title="Job Settings"
			subtitle="Manage job concurrency"
			isOpen={$page.url.searchParams.get('open') === 'job-settings'}
		>
			<JobSettings jobConfig={configs.job} />
		</SettingAccordion>

		<SettingAccordion
			title="Password Authentication"
			subtitle="Manage login with password settings"
		>
			<PasswordLoginSettings passwordLoginConfig={configs.passwordLogin} />
		</SettingAccordion>

		<SettingAccordion title="OAuth Authentication" subtitle="Manage the login with OAuth settings">
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
