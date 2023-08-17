<script lang="ts">
  import { page } from '$app/stores';
  import { APIKeyResponseDto, AuthDeviceResponseDto, oauth, UserResponseDto } from '@api';
  import SettingAccordion from '../admin-page/settings/setting-accordion.svelte';
  import ChangePasswordSettings from './change-password-settings.svelte';
  import DeviceList from './device-list.svelte';
  import MemoriesSettings from './memories-settings.svelte';
  import OAuthSettings from './oauth-settings.svelte';
  import PartnerSettings from './partner-settings.svelte';
  import UserAPIKeyList from './user-api-key-list.svelte';
  import UserProfileSettings from './user-profile-settings.svelte';
  import { onMount } from 'svelte';

  export let user: UserResponseDto;

  export let keys: APIKeyResponseDto[] = [];
  export let devices: AuthDeviceResponseDto[] = [];
  export let partners: UserResponseDto[] = [];

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
  <UserAPIKeyList bind:keys />
</SettingAccordion>

<SettingAccordion title="Authorized Devices" subtitle="Manage your logged-in devices">
  <DeviceList bind:devices />
</SettingAccordion>

<SettingAccordion title="Memories" subtitle="Manage what you see in your memories.">
  <MemoriesSettings {user} />
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
  <PartnerSettings {user} bind:partners />
</SettingAccordion>
