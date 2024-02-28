<script lang="ts">
  import { page } from '$app/stores';
  import { OpenSettingQueryParameterValue, QueryParameter } from '$lib/constants';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { user } from '$lib/stores/user.store';
  import { oauth } from '$lib/utils';
  import { type ApiKeyResponseDto, type AuthDeviceResponseDto } from '@immich/sdk';
  import SettingAccordion from '../shared-components/settings/setting-accordion.svelte';
  import AppearanceSettings from './appearance-settings.svelte';
  import ChangePasswordSettings from './change-password-settings.svelte';
  import DeviceList from './device-list.svelte';
  import MemoriesSettings from './memories-settings.svelte';
  import OAuthSettings from './oauth-settings.svelte';
  import PartnerSettings from './partner-settings.svelte';
  import TrashSettings from './trash-settings.svelte';
  import UserAPIKeyList from './user-api-key-list.svelte';
  import UserProfileSettings from './user-profile-settings.svelte';
  import SettingAccordionState from '../shared-components/settings/setting-accordion-state.svelte';

  export let keys: ApiKeyResponseDto[] = [];
  export let devices: AuthDeviceResponseDto[] = [];

  let oauthOpen =
    oauth.isCallback(window.location) ||
    $page.url.searchParams.get(QueryParameter.OPEN_SETTING) === OpenSettingQueryParameterValue.OAUTH;
</script>

<SettingAccordionState queryParam={QueryParameter.IS_OPEN}>
  <SettingAccordion key="appearance" title="Appearance" subtitle="Manage the app appearance">
    <AppearanceSettings />
  </SettingAccordion>

  <SettingAccordion key="account" title="Account" subtitle="Manage your account">
    <UserProfileSettings />
  </SettingAccordion>

  <SettingAccordion key="api-keys" title="API Keys" subtitle="Manage your API keys">
    <UserAPIKeyList bind:keys />
  </SettingAccordion>

  <SettingAccordion key="authorized-devices" title="Authorized Devices" subtitle="Manage your logged-in devices">
    <DeviceList bind:devices />
  </SettingAccordion>

  <SettingAccordion key="memories" title="Memories" subtitle="Manage what you see in your memories.">
    <MemoriesSettings user={$user} />
  </SettingAccordion>

  {#if $featureFlags.loaded && $featureFlags.oauth}
    <SettingAccordion key="oauth" title="OAuth" subtitle="Manage your OAuth connection" isOpen={oauthOpen || undefined}>
      <OAuthSettings user={$user} />
    </SettingAccordion>
  {/if}

  <SettingAccordion key="password" title="Password" subtitle="Change your password">
    <ChangePasswordSettings />
  </SettingAccordion>

  <SettingAccordion key="sharing" title="Sharing" subtitle="Manage sharing with partners">
    <PartnerSettings user={$user} />
  </SettingAccordion>

  <SettingAccordion key="trash" title="Trash" subtitle="Manage trash settings">
    <TrashSettings />
  </SettingAccordion>
</SettingAccordionState>
