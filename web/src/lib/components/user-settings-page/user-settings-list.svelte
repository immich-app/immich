<script lang="ts">
	import { page } from '$app/stores';
	import { oauth, UserResponseDto } from '@api';
	import { onMount } from 'svelte';
	import SettingAccordion from '../admin-page/settings/setting-accordion.svelte';
	import ChangePasswordSettings from './change-password-settings.svelte';
	import OAuthSettings from './oauth-settings.svelte';
	import UserAPIKeyList from './user-api-key-list.svelte';
	import DeviceList from './device-list.svelte';
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

<SettingAccordion title="User Profile" subtitle="View and manage your profile">
	<UserProfileSettings {user} />
</SettingAccordion>

<SettingAccordion title="Password" subtitle="Change your password">
	<ChangePasswordSettings />
</SettingAccordion>

<SettingAccordion title="API Keys" subtitle="View and manage your API keys">
	<UserAPIKeyList />
</SettingAccordion>

{#if oauthEnabled}
	<SettingAccordion
		title="OAuth"
		subtitle="Manage your linked account"
		isOpen={oauthOpen || $page.url.searchParams.get('open') === 'oauth'}
	>
		<OAuthSettings {user} />
	</SettingAccordion>
{/if}

<SettingAccordion title="Authorized Devices" subtitle="View and manage your logged-in devices">
	<DeviceList />
</SettingAccordion>
