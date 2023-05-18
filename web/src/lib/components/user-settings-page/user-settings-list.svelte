<script lang="ts">
	import { page } from '$app/stores';
	import { oauth, UserResponseDto } from '@api';
	import { onMount } from 'svelte';
	import SettingAccordion from '../admin-page/settings/setting-accordion.svelte';
	import ChangePasswordSettings from './change-password-settings.svelte';
	import OAuthSettings from './oauth-settings.svelte';
	import UserAPIKeyList from './user-api-key-list.svelte';
	import DeviceList from './device-list.svelte';
	import PartnerSettings from './partner-settings.svelte';
	import UserProfileSettings from './user-profile-settings.svelte';

	export let user: UserResponseDto;

	let oauthEnabled = false;
	let oauthOpen = false;

	onMount(async () => {
		oauthOpen = oauth.isCallback(window.location);

		try {
			const { data } = await oauth.getConfig(window.location);
			oauthEnabled = data.enabled;
		} catch {
			// noop
		}
	});
</script>

<SettingAccordion title="Account" subtitle="Manage your account">
	<UserProfileSettings {user} />
</SettingAccordion>

<SettingAccordion title="API Keys" subtitle="Manage your API keys">
	<UserAPIKeyList />
</SettingAccordion>

<SettingAccordion title="Authorized Devices" subtitle="Manage your logged-in devices">
	<DeviceList />
</SettingAccordion>

{#if oauthEnabled}
	<SettingAccordion
		title="OAuth"
		subtitle="Manage your OAuth connection"
		isOpen={oauthOpen || $page.url.searchParams.get('open') === 'oauth'}
	>
		<OAuthSettings {user} />
	</SettingAccordion>
{/if}

<SettingAccordion title="Password" subtitle="Change your password">
	<ChangePasswordSettings />
</SettingAccordion>

<SettingAccordion title="Sharing" subtitle="Manage sharing with partners">
	<PartnerSettings {user} />
</SettingAccordion>
