<script lang="ts">
  import ConfirmDialog from '$lib/components/shared-components/dialog/confirm-dialog.svelte';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { type SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';
  import { t } from 'svelte-i18n';
  import FormatMessage from '$lib/components/i18n/format-message.svelte';

  export let savedConfig: SystemConfigDto;
  export let defaultConfig: SystemConfigDto;
  export let config: SystemConfigDto; // this is the config that is being edited
  export let disabled = false;
  export let onReset: SettingsResetEvent;
  export let onSave: SettingsSaveEvent;

  let isConfirmOpen = false;

  const handleToggleOverride = () => {
    // click runs before bind
    const previouslyEnabled = config.oauth.mobileOverrideEnabled;
    if (!previouslyEnabled && !config.oauth.mobileRedirectUri) {
      config.oauth.mobileRedirectUri = window.location.origin + '/api/oauth/mobile-redirect';
    }
  };

  const handleSave = (skipConfirm: boolean) => {
    const allMethodsDisabled = !config.oauth.enabled && !config.passwordLogin.enabled;
    if (allMethodsDisabled && !skipConfirm) {
      isConfirmOpen = true;
      return;
    }

    isConfirmOpen = false;
    onSave({ passwordLogin: config.passwordLogin, oauth: config.oauth });
  };
</script>

{#if isConfirmOpen}
  <ConfirmDialog
    title={$t('admin.disable_login')}
    onCancel={() => (isConfirmOpen = false)}
    onConfirm={() => handleSave(true)}
  >
    <svelte:fragment slot="prompt">
      <div class="flex flex-col gap-4">
        <p>{$t('admin.authentication_settings_disable_all')}</p>
        <p>
          <FormatMessage key="admin.authentication_settings_reenable" let:message>
            <a
              href="https://immich.app/docs/administration/server-commands"
              rel="noreferrer"
              target="_blank"
              class="underline"
            >
              {message}
            </a>
          </FormatMessage>
        </p>
      </div>
    </svelte:fragment>
  </ConfirmDialog>
{/if}

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="ml-4 mt-4 flex flex-col">
        <SettingAccordion
          key="oauth"
          title={$t('admin.oauth_settings')}
          subtitle={$t('admin.oauth_settings_description')}
        >
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <p class="text-sm dark:text-immich-dark-fg">
              <FormatMessage key="admin.oauth_settings_more_details" let:message>
                <a
                  href="https://immich.app/docs/administration/oauth"
                  class="underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {message}
                </a>
              </FormatMessage>
            </p>

            <SettingSwitch
              {disabled}
              title={$t('admin.oauth_enable_description')}
              bind:checked={config.oauth.enabled}
            />

            {#if config.oauth.enabled}
              <hr />
              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label={$t('admin.oauth_issuer_url').toUpperCase()}
                bind:value={config.oauth.issuerUrl}
                required={true}
                disabled={disabled || !config.oauth.enabled}
                isEdited={!(config.oauth.issuerUrl == savedConfig.oauth.issuerUrl)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label={$t('admin.oauth_client_id').toUpperCase()}
                bind:value={config.oauth.clientId}
                required={true}
                disabled={disabled || !config.oauth.enabled}
                isEdited={!(config.oauth.clientId == savedConfig.oauth.clientId)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label={$t('admin.oauth_client_secret').toUpperCase()}
                bind:value={config.oauth.clientSecret}
                required={true}
                disabled={disabled || !config.oauth.enabled}
                isEdited={!(config.oauth.clientSecret == savedConfig.oauth.clientSecret)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label={$t('admin.oauth_scope').toUpperCase()}
                bind:value={config.oauth.scope}
                required={true}
                disabled={disabled || !config.oauth.enabled}
                isEdited={!(config.oauth.scope == savedConfig.oauth.scope)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label={$t('admin.oauth_signing_algorithm').toUpperCase()}
                bind:value={config.oauth.signingAlgorithm}
                required={true}
                disabled={disabled || !config.oauth.enabled}
                isEdited={!(config.oauth.signingAlgorithm == savedConfig.oauth.signingAlgorithm)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label={$t('admin.oauth_profile_signing_algorithm').toUpperCase()}
                desc={$t('admin.oauth_profile_signing_algorithm_description')}
                bind:value={config.oauth.profileSigningAlgorithm}
                required={true}
                disabled={disabled || !config.oauth.enabled}
                isEdited={!(config.oauth.profileSigningAlgorithm == savedConfig.oauth.profileSigningAlgorithm)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label={$t('admin.oauth_storage_label_claim').toUpperCase()}
                desc={$t('admin.oauth_storage_label_claim_description')}
                bind:value={config.oauth.storageLabelClaim}
                required={true}
                disabled={disabled || !config.oauth.enabled}
                isEdited={!(config.oauth.storageLabelClaim == savedConfig.oauth.storageLabelClaim)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label={$t('admin.oauth_storage_quota_claim').toUpperCase()}
                desc={$t('admin.oauth_storage_quota_claim_description')}
                bind:value={config.oauth.storageQuotaClaim}
                required={true}
                disabled={disabled || !config.oauth.enabled}
                isEdited={!(config.oauth.storageQuotaClaim == savedConfig.oauth.storageQuotaClaim)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.NUMBER}
                label={$t('admin.oauth_storage_quota_default').toUpperCase()}
                desc={$t('admin.oauth_storage_quota_default_description')}
                bind:value={config.oauth.defaultStorageQuota}
                required={true}
                disabled={disabled || !config.oauth.enabled}
                isEdited={!(config.oauth.defaultStorageQuota == savedConfig.oauth.defaultStorageQuota)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label={$t('admin.oauth_button_text').toUpperCase()}
                bind:value={config.oauth.buttonText}
                required={false}
                disabled={disabled || !config.oauth.enabled}
                isEdited={!(config.oauth.buttonText == savedConfig.oauth.buttonText)}
              />

              <SettingSwitch
                title={$t('admin.oauth_auto_register').toUpperCase()}
                subtitle={$t('admin.oauth_auto_register_description')}
                bind:checked={config.oauth.autoRegister}
                disabled={disabled || !config.oauth.enabled}
              />

              <SettingSwitch
                title={$t('admin.oauth_auto_launch').toUpperCase()}
                subtitle={$t('admin.oauth_auto_launch_description')}
                disabled={disabled || !config.oauth.enabled}
                bind:checked={config.oauth.autoLaunch}
              />

              <SettingSwitch
                title={$t('admin.oauth_mobile_redirect_uri_override').toUpperCase()}
                subtitle={$t('admin.oauth_mobile_redirect_uri_override_description', {
                  values: { callback: 'app.immich:///oauth-callback' },
                })}
                disabled={disabled || !config.oauth.enabled}
                on:click={() => handleToggleOverride()}
                bind:checked={config.oauth.mobileOverrideEnabled}
              />

              {#if config.oauth.mobileOverrideEnabled}
                <SettingInputField
                  inputType={SettingInputFieldType.TEXT}
                  label={$t('admin.oauth_mobile_redirect_uri').toUpperCase()}
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
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <div class="ml-4 mt-4 flex flex-col">
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
