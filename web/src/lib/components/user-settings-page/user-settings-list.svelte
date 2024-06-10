<script lang="ts">
  import { page } from '$app/stores';
  import { OpenSettingQueryParameterValue, QueryParameter } from '$lib/constants';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { user } from '$lib/stores/user.store';
  import { oauth } from '$lib/utils';
  import { type ApiKeyResponseDto, type SessionResponseDto } from '@immich/sdk';
  import SettingAccordionState from '../shared-components/settings/setting-accordion-state.svelte';
  import SettingAccordion from '../shared-components/settings/setting-accordion.svelte';
  import AppSettings from './app-settings.svelte';
  import ChangePasswordSettings from './change-password-settings.svelte';
  import DeviceList from './device-list.svelte';
  import MemoriesSettings from './memories-settings.svelte';
  import OAuthSettings from './oauth-settings.svelte';
  import PartnerSettings from './partner-settings.svelte';
  import UserAPIKeyList from './user-api-key-list.svelte';
  import UserProfileSettings from './user-profile-settings.svelte';
  import NotificationsSettings from '$lib/components/user-settings-page/notifications-settings.svelte';
  import { t } from 'svelte-i18n';

  export let keys: ApiKeyResponseDto[] = [];
  export let sessions: SessionResponseDto[] = [];

  let oauthOpen =
    oauth.isCallback(window.location) ||
    $page.url.searchParams.get(QueryParameter.OPEN_SETTING) === OpenSettingQueryParameterValue.OAUTH;
</script>

<SettingAccordionState queryParam={QueryParameter.IS_OPEN}>
  <SettingAccordion key="app-settings" title={$t('app_settings')} subtitle={$t('manage_the_app_settings')}>
    <AppSettings />
  </SettingAccordion>

  <SettingAccordion key="account" title={$t('account')} subtitle={$t('manage_your_account')}>
    <UserProfileSettings />
  </SettingAccordion>

  <SettingAccordion key="api-keys" title={$t('api_keys')} subtitle={$t('manage_your_api_keys')}>
    <UserAPIKeyList bind:keys />
  </SettingAccordion>

  <SettingAccordion key="authorized-devices" title={$t('authorized_devices')} subtitle={$t('manage_your_devices')}>
    <DeviceList bind:devices={sessions} />
  </SettingAccordion>

  <SettingAccordion key="memories" title={$t('memories')} subtitle={$t('memories_setting_description')}>
    <MemoriesSettings />
  </SettingAccordion>

  <SettingAccordion key="notifications" title={$t('notifications')} subtitle={$t('notifications_setting_description')}>
    <NotificationsSettings />
  </SettingAccordion>

  {#if $featureFlags.loaded && $featureFlags.oauth}
    <SettingAccordion
      key="oauth"
      title={$t('oauth')}
      subtitle={$t('manage_your_oauth_connection')}
      isOpen={oauthOpen || undefined}
    >
      <OAuthSettings user={$user} />
    </SettingAccordion>
  {/if}

  <SettingAccordion key="password" title={$t('password')} subtitle={$t('change_your_password')}>
    <ChangePasswordSettings />
  </SettingAccordion>

  <SettingAccordion key="partner-sharing" title={$t('partner_sharing')} subtitle={$t('manage_sharing_with_partners')}>
    <PartnerSettings user={$user} />
  </SettingAccordion>
</SettingAccordionState>
