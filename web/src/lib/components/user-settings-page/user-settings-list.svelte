<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { APIKeyResponseDto, AuthDeviceResponseDto, oauth } from '@api';
  import SettingAccordion from '../admin-page/settings/setting-accordion.svelte';
  import ChangePasswordSettings from './change-password-settings.svelte';
  import DeviceList from './device-list.svelte';
  import LibraryList from './library-list.svelte';
  import MemoriesSettings from './memories-settings.svelte';
  import OAuthSettings from './oauth-settings.svelte';
  import PartnerSettings from './partner-settings.svelte';
  import SidebarSettings from './sidebar-settings.svelte';
  import UserAPIKeyList from './user-api-key-list.svelte';
  import UserProfileSettings from './user-profile-settings.svelte';
  import { user } from '$lib/stores/user.store';

  export let keys: APIKeyResponseDto[] = [];
  export let devices: AuthDeviceResponseDto[] = [];

  let oauthOpen = false;
  if (browser) {
    oauthOpen = oauth.isCallback(window.location);
  }
</script>

<SettingAccordion title="Account" subtitle="Manage your account">
  <UserProfileSettings user={$user} />
</SettingAccordion>

<SettingAccordion title="API Keys" subtitle="Manage your API keys">
  <UserAPIKeyList bind:keys />
</SettingAccordion>

<SettingAccordion title="Authorized Devices" subtitle="Manage your logged-in devices">
  <DeviceList bind:devices />
</SettingAccordion>

<SettingAccordion title="Libraries" subtitle="Manage your asset libraries">
  <LibraryList />
</SettingAccordion>

<SettingAccordion title="Memories" subtitle="Manage what you see in your memories.">
  <MemoriesSettings user={$user} />
</SettingAccordion>

{#if $featureFlags.loaded && $featureFlags.oauth}
  <SettingAccordion
    title="OAuth"
    subtitle="Manage your OAuth connection"
    isOpen={oauthOpen || $page.url.searchParams.get('open') === 'oauth'}
  >
    <OAuthSettings user={$user} />
  </SettingAccordion>
{/if}

<SettingAccordion title="Password" subtitle="Change your password">
  <ChangePasswordSettings />
</SettingAccordion>

<SettingAccordion title="Sharing" subtitle="Manage sharing with partners">
  <PartnerSettings user={$user} />
</SettingAccordion>

<SettingAccordion title="Sidebar" subtitle="Manage sidebar settings">
  <SidebarSettings />
</SettingAccordion>
