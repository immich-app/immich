<script lang="ts">
  import { page } from '$app/stores';
  import ChangePinCodeSettings from './PinCodeSettings.svelte';
  import DownloadSettings from './DownloadSettings.svelte';
  import FeatureSettings from './FeatureSettings.svelte';
  import NotificationsSettings from './NotificationsSettings.svelte';
  import UserPurchaseSettings from './UserPurchaseSettings.svelte';
  import UserUsageStatistic from './UserUsageStatistic.svelte';
  import { OpenQueryParam, QueryParameter } from '$lib/constants';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { oauth } from '$lib/utils';
  import { type ApiKeyResponseDto, type SessionResponseDto } from '@immich/sdk';
  import {
    mdiAccountGroupOutline,
    mdiAccountOutline,
    mdiApi,
    mdiBellOutline,
    mdiCogOutline,
    mdiDevices,
    mdiDownload,
    mdiFeatureSearchOutline,
    mdiFormTextboxPassword,
    mdiKeyOutline,
    mdiLockSmart,
    mdiServerOutline,
    mdiTwoFactorAuthentication,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import SettingAccordionState from '$lib/components/shared-components/settings/SettingAccordionState.svelte';
  import SettingAccordion from '$lib/components/shared-components/settings/SettingAccordion.svelte';
  import AppSettings from './AppSettings.svelte';
  import ChangePasswordSettings from './ChangePasswordSettings.svelte';
  import DeviceList from './DeviceList.svelte';
  import OauthSettings from './OauthSettings.svelte';
  import PartnerSettings from './PartnerSettings.svelte';
  import UserApiKeyList from './UserApiKeyList.svelte';
  import UserProfileSettings from './UserProfileSettings.svelte';

  interface Props {
    keys?: ApiKeyResponseDto[];
    sessions?: SessionResponseDto[];
  }

  let { keys = $bindable([]), sessions = $bindable([]) }: Props = $props();

  let oauthOpen =
    oauth.isCallback(globalThis.location) ||
    $page.url.searchParams.get(QueryParameter.OPEN_SETTING) === OpenQueryParam.OAUTH;
</script>

<SettingAccordionState queryParam={QueryParameter.IS_OPEN}>
  <SettingAccordion
    icon={mdiCogOutline}
    key="app-settings"
    title={$t('app_settings')}
    subtitle={$t('manage_the_app_settings')}
  >
    <AppSettings />
  </SettingAccordion>

  <SettingAccordion icon={mdiAccountOutline} key="account" title={$t('account')} subtitle={$t('manage_your_account')}>
    <UserProfileSettings />
  </SettingAccordion>

  <SettingAccordion
    icon={mdiServerOutline}
    key="user-usage-info"
    title={$t('user_usage_stats')}
    subtitle={$t('user_usage_stats_description')}
  >
    <UserUsageStatistic />
  </SettingAccordion>

  <SettingAccordion icon={mdiApi} key="api-keys" title={$t('api_keys')} subtitle={$t('manage_your_api_keys')}>
    <UserApiKeyList bind:keys />
  </SettingAccordion>

  <SettingAccordion
    icon={mdiDevices}
    key="authorized-devices"
    title={$t('authorized_devices')}
    subtitle={$t('manage_your_devices')}
  >
    <DeviceList bind:devices={sessions} />
  </SettingAccordion>

  <SettingAccordion
    icon={mdiDownload}
    key="download-settings"
    title={$t('download_settings')}
    subtitle={$t('download_settings_description')}
  >
    <DownloadSettings />
  </SettingAccordion>

  <SettingAccordion
    icon={mdiFeatureSearchOutline}
    key="feature"
    title={$t('features')}
    subtitle={$t('features_setting_description')}
  >
    <FeatureSettings />
  </SettingAccordion>

  <SettingAccordion
    icon={mdiBellOutline}
    key={OpenQueryParam.NOTIFICATIONS}
    title={$t('notifications')}
    subtitle={$t('notifications_setting_description')}
  >
    <NotificationsSettings />
  </SettingAccordion>

  {#if featureFlagsManager.value.oauth}
    <SettingAccordion
      icon={mdiTwoFactorAuthentication}
      key={OpenQueryParam.OAUTH}
      title={$t('oauth')}
      subtitle={$t('manage_your_oauth_connection')}
      isOpen={oauthOpen || undefined}
    >
      <OauthSettings />
    </SettingAccordion>
  {/if}

  <SettingAccordion
    icon={mdiFormTextboxPassword}
    key="password"
    title={$t('password')}
    subtitle={$t('change_your_password')}
  >
    <ChangePasswordSettings />
  </SettingAccordion>

  <SettingAccordion
    icon={mdiAccountGroupOutline}
    key="partner-sharing"
    title={$t('partner_sharing')}
    subtitle={$t('manage_sharing_with_partners')}
  >
    <PartnerSettings />
  </SettingAccordion>

  <SettingAccordion
    icon={mdiLockSmart}
    key="user-pin-code-settings"
    title={$t('user_pin_code_settings')}
    subtitle={$t('user_pin_code_settings_description')}
    autoScrollTo={true}
  >
    <ChangePinCodeSettings />
  </SettingAccordion>

  <SettingAccordion
    icon={mdiKeyOutline}
    key={OpenQueryParam.PURCHASE_SETTINGS}
    title={$t('user_purchase_settings')}
    subtitle={$t('user_purchase_settings_description')}
    autoScrollTo={true}
  >
    <UserPurchaseSettings />
  </SettingAccordion>
</SettingAccordionState>
