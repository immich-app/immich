<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import AuthDisableLoginConfirmModal from '$lib/modals/AuthDisableLoginConfirmModal.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { OAuthTokenEndpointAuthMethod, unlinkAllOAuthAccountsAdmin, type SystemConfigDto } from '@immich/sdk';
  import { Button, modalManager, Text } from '@immich/ui';
  import { mdiRestart } from '@mdi/js';
  import { isEqual } from 'lodash-es';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from './admin-settings';

  interface Props {
    savedConfig: SystemConfigDto;
    defaultConfig: SystemConfigDto;
    config: SystemConfigDto;
    disabled?: boolean;
    onReset: SettingsResetEvent;
    onSave: SettingsSaveEvent;
  }

  let { savedConfig, defaultConfig, config = $bindable(), disabled = false, onReset, onSave }: Props = $props();

  const handleToggleOverride = () => {
    // click runs before bind
    const previouslyEnabled = config.oauth.mobileOverrideEnabled;
    if (!previouslyEnabled && !config.oauth.mobileRedirectUri) {
      config.oauth.mobileRedirectUri = globalThis.location.origin + '/api/oauth/mobile-redirect';
    }
  };

  const handleSave = async (skipConfirm: boolean) => {
    const allMethodsDisabled = !config.oauth.enabled && !config.passwordLogin.enabled;
    if (allMethodsDisabled && !skipConfirm) {
      const isConfirmed = await modalManager.show(AuthDisableLoginConfirmModal);
      if (!isConfirmed) {
        return;
      }
    }

    onSave({ passwordLogin: config.passwordLogin, oauth: config.oauth });
  };

  const handleUnlinkAllOAuthAccounts = async () => {
    const confirmed = await modalManager.showDialog({
      icon: mdiRestart,
      title: $t('admin.unlink_all_oauth_accounts'),
      prompt: $t('admin.unlink_all_oauth_accounts_prompt'),
      confirmColor: 'danger',
    });

    if (!confirmed) {
      return;
    }

    try {
      await unlinkAllOAuthAccountsAdmin({});
      notificationController.show({ message: $t('success'), type: NotificationType.Info });
    } catch (error) {
      handleError(error, $t('errors.something_went_wrong'));
    }
  };
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" onsubmit={(e) => e.preventDefault()}>
      <div class="ms-4 mt-4 flex flex-col">
        <SettingAccordion
          key="oauth"
          title={$t('admin.oauth_settings')}
          subtitle={$t('admin.oauth_settings_description')}
        >
          <div class="ms-4 mt-4 flex flex-col gap-4">
            <Text size="small">
              <FormatMessage key="admin.oauth_settings_more_details">
                {#snippet children({ message })}
                  <a
                    href="https://immich.app/docs/administration/oauth"
                    class="underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {message}
                  </a>
                {/snippet}
              </FormatMessage>
            </Text>

            <SettingSwitch
              {disabled}
              title={$t('admin.oauth_enable_description')}
              bind:checked={config.oauth.enabled}
            />

            {#if config.oauth.enabled}
              <hr />

              <div class="flex items-center gap-2 justify-between">
                <Text size="small">{$t('admin.unlink_all_oauth_accounts_description')}</Text>
                <Button size="small" onclick={handleUnlinkAllOAuthAccounts}
                  >{$t('admin.unlink_all_oauth_accounts')}</Button
                >
              </div>

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label="ISSUER_URL"
                bind:value={config.oauth.issuerUrl}
                required={true}
                disabled={disabled || !config.oauth.enabled}
                isEdited={!(config.oauth.issuerUrl == savedConfig.oauth.issuerUrl)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label="CLIENT_ID"
                bind:value={config.oauth.clientId}
                required={true}
                disabled={disabled || !config.oauth.enabled}
                isEdited={!(config.oauth.clientId == savedConfig.oauth.clientId)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label="CLIENT_SECRET"
                description={$t('admin.oauth_client_secret_description')}
                bind:value={config.oauth.clientSecret}
                disabled={disabled || !config.oauth.enabled}
                isEdited={!(config.oauth.clientSecret == savedConfig.oauth.clientSecret)}
              />

              {#if config.oauth.clientSecret}
                <SettingSelect
                  label="TOKEN_ENDPOINT_AUTH_METHOD"
                  bind:value={config.oauth.tokenEndpointAuthMethod}
                  disabled={disabled || !config.oauth.enabled || !config.oauth.clientSecret}
                  isEdited={!(config.oauth.tokenEndpointAuthMethod == savedConfig.oauth.tokenEndpointAuthMethod)}
                  options={[
                    { value: OAuthTokenEndpointAuthMethod.ClientSecretPost, text: 'client_secret_post' },
                    { value: OAuthTokenEndpointAuthMethod.ClientSecretBasic, text: 'client_secret_basic' },
                  ]}
                  name="tokenEndpointAuthMethod"
                />
              {/if}

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label="SCOPE"
                bind:value={config.oauth.scope}
                required={true}
                disabled={disabled || !config.oauth.enabled}
                isEdited={!(config.oauth.scope == savedConfig.oauth.scope)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label="ID_TOKEN_SIGNED_RESPONSE_ALG"
                bind:value={config.oauth.signingAlgorithm}
                required={true}
                disabled={disabled || !config.oauth.enabled}
                isEdited={!(config.oauth.signingAlgorithm == savedConfig.oauth.signingAlgorithm)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label="USERINFO_SIGNED_RESPONSE_ALG"
                bind:value={config.oauth.profileSigningAlgorithm}
                required={true}
                disabled={disabled || !config.oauth.enabled}
                isEdited={!(config.oauth.profileSigningAlgorithm == savedConfig.oauth.profileSigningAlgorithm)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.NUMBER}
                label={$t('admin.oauth_timeout')}
                description={$t('admin.oauth_timeout_description')}
                required={true}
                bind:value={config.oauth.timeout}
                disabled={disabled || !config.oauth.enabled}
                isEdited={!(config.oauth.timeout == savedConfig.oauth.timeout)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label={$t('admin.oauth_storage_label_claim')}
                description={$t('admin.oauth_storage_label_claim_description')}
                bind:value={config.oauth.storageLabelClaim}
                required={true}
                disabled={disabled || !config.oauth.enabled}
                isEdited={!(config.oauth.storageLabelClaim == savedConfig.oauth.storageLabelClaim)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label={$t('admin.oauth_role_claim')}
                description={$t('admin.oauth_role_claim_description')}
                bind:value={config.oauth.roleClaim}
                required={true}
                disabled={disabled || !config.oauth.enabled}
                isEdited={!(config.oauth.roleClaim == savedConfig.oauth.roleClaim)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label={$t('admin.oauth_storage_quota_claim')}
                description={$t('admin.oauth_storage_quota_claim_description')}
                bind:value={config.oauth.storageQuotaClaim}
                required={true}
                disabled={disabled || !config.oauth.enabled}
                isEdited={!(config.oauth.storageQuotaClaim == savedConfig.oauth.storageQuotaClaim)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.NUMBER}
                label={$t('admin.oauth_storage_quota_default')}
                description={$t('admin.oauth_storage_quota_default_description')}
                bind:value={config.oauth.defaultStorageQuota}
                required={false}
                disabled={disabled || !config.oauth.enabled}
                isEdited={!(config.oauth.defaultStorageQuota == savedConfig.oauth.defaultStorageQuota)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label={$t('admin.oauth_button_text')}
                bind:value={config.oauth.buttonText}
                required={false}
                disabled={disabled || !config.oauth.enabled}
                isEdited={!(config.oauth.buttonText == savedConfig.oauth.buttonText)}
              />

              <SettingSwitch
                title={$t('admin.oauth_auto_register')}
                subtitle={$t('admin.oauth_auto_register_description')}
                bind:checked={config.oauth.autoRegister}
                disabled={disabled || !config.oauth.enabled}
              />

              <SettingSwitch
                title={$t('admin.oauth_auto_launch')}
                subtitle={$t('admin.oauth_auto_launch_description')}
                disabled={disabled || !config.oauth.enabled}
                bind:checked={config.oauth.autoLaunch}
              />

              <SettingSwitch
                title={$t('admin.oauth_mobile_redirect_uri_override')}
                subtitle={$t('admin.oauth_mobile_redirect_uri_override_description', {
                  values: { callback: 'app.immich:///oauth-callback' },
                })}
                disabled={disabled || !config.oauth.enabled}
                onToggle={() => handleToggleOverride()}
                bind:checked={config.oauth.mobileOverrideEnabled}
              />

              {#if config.oauth.mobileOverrideEnabled}
                <SettingInputField
                  inputType={SettingInputFieldType.TEXT}
                  label={$t('admin.oauth_mobile_redirect_uri')}
                  bind:value={config.oauth.mobileRedirectUri}
                  required={true}
                  disabled={disabled || !config.oauth.enabled}
                  isEdited={!(config.oauth.mobileRedirectUri == savedConfig.oauth.mobileRedirectUri)}
                />
              {/if}
            {/if}
          </div>
        </SettingAccordion>

        <SettingAccordion
          key="password"
          title={$t('admin.password_settings')}
          subtitle={$t('admin.password_settings_description')}
        >
          <div class="ms-4 mt-4 flex flex-col gap-4">
            <div class="ms-4 mt-4 flex flex-col">
              <SettingSwitch
                title={$t('admin.password_enable_description')}
                {disabled}
                bind:checked={config.passwordLogin.enabled}
              />
            </div>
          </div>
        </SettingAccordion>

        <SettingButtonsRow
          showResetToDefault={!isEqual(savedConfig.passwordLogin, defaultConfig.passwordLogin) ||
            !isEqual(savedConfig.oauth, defaultConfig.oauth)}
          {disabled}
          onReset={(options) => onReset({ ...options, configKeys: ['passwordLogin', 'oauth'] })}
          onSave={() => handleSave(false)}
        />
      </div>
    </form>
  </div>
</div>
