<script lang="ts">
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import AuthDisableLoginConfirmModal from '$lib/modals/AuthDisableLoginConfirmModal.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { OAuthTokenEndpointAuthMethod, unlinkAllOAuthAccountsAdmin } from '@immich/sdk';
  import { Button, modalManager, Text, toastManager } from '@immich/ui';
  import { mdiRestart } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const disabled = $derived(featureFlagsManager.value.configFile);
  const config = $derived(systemConfigManager.value);
  let configToEdit = $state(systemConfigManager.cloneValue());

  const handleToggleOverride = () => {
    // click runs before bind
    const previouslyEnabled = configToEdit.oauth.mobileOverrideEnabled;
    if (!previouslyEnabled && !configToEdit.oauth.mobileRedirectUri) {
      configToEdit.oauth.mobileRedirectUri = globalThis.location.origin + '/api/oauth/mobile-redirect';
    }
  };

  const onBeforeSave = async () => {
    const allMethodsDisabled = !configToEdit.oauth.enabled && !configToEdit.passwordLogin.enabled;

    if (allMethodsDisabled) {
      const confirmed = await modalManager.show(AuthDisableLoginConfirmModal);
      if (!confirmed) {
        return false;
      }
    }

    return true;
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
      await unlinkAllOAuthAccountsAdmin();
      toastManager.success();
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
                    href="https://docs.immich.app/administration/oauth"
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
              bind:checked={configToEdit.oauth.enabled}
            />

            {#if configToEdit.oauth.enabled}
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
                bind:value={configToEdit.oauth.issuerUrl}
                required={true}
                disabled={disabled || !configToEdit.oauth.enabled}
                isEdited={!(configToEdit.oauth.issuerUrl === config.oauth.issuerUrl)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label="CLIENT_ID"
                bind:value={configToEdit.oauth.clientId}
                required={true}
                disabled={disabled || !configToEdit.oauth.enabled}
                isEdited={!(configToEdit.oauth.clientId === config.oauth.clientId)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label="CLIENT_SECRET"
                description={$t('admin.oauth_client_secret_description')}
                bind:value={configToEdit.oauth.clientSecret}
                disabled={disabled || !configToEdit.oauth.enabled}
                isEdited={!(configToEdit.oauth.clientSecret === config.oauth.clientSecret)}
              />

              {#if configToEdit.oauth.clientSecret}
                <SettingSelect
                  label="TOKEN_ENDPOINT_AUTH_METHOD"
                  bind:value={configToEdit.oauth.tokenEndpointAuthMethod}
                  disabled={disabled || !configToEdit.oauth.enabled || !configToEdit.oauth.clientSecret}
                  isEdited={!(configToEdit.oauth.tokenEndpointAuthMethod === config.oauth.tokenEndpointAuthMethod)}
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
                bind:value={configToEdit.oauth.scope}
                required={true}
                disabled={disabled || !configToEdit.oauth.enabled}
                isEdited={!(configToEdit.oauth.scope === config.oauth.scope)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label="ID_TOKEN_SIGNED_RESPONSE_ALG"
                bind:value={configToEdit.oauth.signingAlgorithm}
                required={true}
                disabled={disabled || !configToEdit.oauth.enabled}
                isEdited={!(configToEdit.oauth.signingAlgorithm === config.oauth.signingAlgorithm)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label="USERINFO_SIGNED_RESPONSE_ALG"
                bind:value={configToEdit.oauth.profileSigningAlgorithm}
                required={true}
                disabled={disabled || !configToEdit.oauth.enabled}
                isEdited={!(configToEdit.oauth.profileSigningAlgorithm === config.oauth.profileSigningAlgorithm)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.NUMBER}
                label={$t('admin.oauth_timeout')}
                description={$t('admin.oauth_timeout_description')}
                required={true}
                bind:value={configToEdit.oauth.timeout}
                disabled={disabled || !configToEdit.oauth.enabled}
                isEdited={!(configToEdit.oauth.timeout === config.oauth.timeout)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label={$t('admin.oauth_storage_label_claim')}
                description={$t('admin.oauth_storage_label_claim_description')}
                bind:value={configToEdit.oauth.storageLabelClaim}
                required={true}
                disabled={disabled || !configToEdit.oauth.enabled}
                isEdited={!(configToEdit.oauth.storageLabelClaim === config.oauth.storageLabelClaim)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label={$t('admin.oauth_role_claim')}
                description={$t('admin.oauth_role_claim_description')}
                bind:value={configToEdit.oauth.roleClaim}
                required={true}
                disabled={disabled || !configToEdit.oauth.enabled}
                isEdited={!(configToEdit.oauth.roleClaim === config.oauth.roleClaim)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label={$t('admin.oauth_storage_quota_claim')}
                description={$t('admin.oauth_storage_quota_claim_description')}
                bind:value={configToEdit.oauth.storageQuotaClaim}
                required={true}
                disabled={disabled || !configToEdit.oauth.enabled}
                isEdited={!(configToEdit.oauth.storageQuotaClaim === config.oauth.storageQuotaClaim)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.NUMBER}
                label={$t('admin.oauth_storage_quota_default')}
                description={$t('admin.oauth_storage_quota_default_description')}
                bind:value={configToEdit.oauth.defaultStorageQuota}
                required={false}
                disabled={disabled || !configToEdit.oauth.enabled}
                isEdited={!(configToEdit.oauth.defaultStorageQuota === config.oauth.defaultStorageQuota)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label={$t('admin.oauth_button_text')}
                bind:value={configToEdit.oauth.buttonText}
                required={false}
                disabled={disabled || !configToEdit.oauth.enabled}
                isEdited={!(configToEdit.oauth.buttonText === config.oauth.buttonText)}
              />

              <SettingSwitch
                title={$t('admin.oauth_auto_register')}
                subtitle={$t('admin.oauth_auto_register_description')}
                bind:checked={configToEdit.oauth.autoRegister}
                disabled={disabled || !configToEdit.oauth.enabled}
              />

              <SettingSwitch
                title={$t('admin.oauth_auto_launch')}
                subtitle={$t('admin.oauth_auto_launch_description')}
                disabled={disabled || !configToEdit.oauth.enabled}
                bind:checked={configToEdit.oauth.autoLaunch}
              />

              <SettingSwitch
                title={$t('admin.oauth_mobile_redirect_uri_override')}
                subtitle={$t('admin.oauth_mobile_redirect_uri_override_description', {
                  values: { callback: 'app.immich:///oauth-callback' },
                })}
                disabled={disabled || !configToEdit.oauth.enabled}
                onToggle={() => handleToggleOverride()}
                bind:checked={configToEdit.oauth.mobileOverrideEnabled}
              />

              {#if configToEdit.oauth.mobileOverrideEnabled}
                <SettingInputField
                  inputType={SettingInputFieldType.TEXT}
                  label={$t('admin.oauth_mobile_redirect_uri')}
                  bind:value={configToEdit.oauth.mobileRedirectUri}
                  required={true}
                  disabled={disabled || !configToEdit.oauth.enabled}
                  isEdited={!(configToEdit.oauth.mobileRedirectUri === config.oauth.mobileRedirectUri)}
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
                bind:checked={configToEdit.passwordLogin.enabled}
              />
            </div>
          </div>
        </SettingAccordion>

        <SettingButtonsRow bind:configToEdit keys={['passwordLogin', 'oauth']} {onBeforeSave} {disabled} />
      </div>
    </form>
  </div>
</div>
