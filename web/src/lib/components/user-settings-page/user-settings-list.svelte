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
	import { LL } from '$lib/i18n/i18n-svelte';

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

<SettingAccordion
	title={$LL.user_settings.account()}
	subtitle={$LL.user_settings.account_subtitle()}
>
	<UserProfileSettings {user} />
</SettingAccordion>

<SettingAccordion
	title={$LL.user_settings.api_keys()}
	subtitle={$LL.user_settings.api_keys_subtitle()}
>
	<UserAPIKeyList />
</SettingAccordion>

<SettingAccordion
	title={$LL.user_settings.authorized_devices()}
	subtitle={$LL.user_settings.authorized_devices_subtitle()}
>
	<DeviceList />
</SettingAccordion>

{#if oauthEnabled}
	<SettingAccordion
		title={$LL.user_settings.oauth()}
		subtitle={$LL.user_settings.oauth_subtitle()}
		isOpen={oauthOpen || $page.url.searchParams.get('open') === 'oauth'}
	>
		<OAuthSettings {user} />
	</SettingAccordion>
{/if}

<SettingAccordion
	title={$LL.user_settings.password()}
	subtitle={$LL.user_settings.password_subtitle()}
>
	<ChangePasswordSettings />
</SettingAccordion>

<SettingAccordion title={$LL.word.sharing()} subtitle={$LL.user_settings.sharing_subtitle()}>
	<PartnerSettings {user} />
</SettingAccordion>
