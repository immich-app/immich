<script lang="ts">
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import SystemSettingsModal from '$lib/modals/SystemSettingsModal.svelte';
  import { handleUnlinkAllOAuthAccounts, onBeforeSave } from '$lib/services/system-config.service';
  import { OAuthTokenEndpointAuthMethod, type SystemConfigDto } from '@immich/sdk';
  import { Alert, Button, Field, Input, NumberInput, Switch, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  const handleToggleOverride = (configToEdit: SystemConfigDto) => {
    // click runs before bind
    const previouslyEnabled = configToEdit.oauth.mobileOverrideEnabled;
    if (!previouslyEnabled && !configToEdit.oauth.mobileRedirectUri) {
      configToEdit.oauth.mobileRedirectUri = globalThis.location.origin + '/api/oauth/mobile-redirect';
    }
  };
</script>

<SystemSettingsModal keys={['oauth']} size="large" {onBeforeSave}>
  {#snippet child({ disabled, config, configToEdit })}
    <Alert color="warning">
      <div>test</div>
      <div class="flex flex-col gap-2 w-full">
        <Text size="small">{$t('admin.unlink_all_oauth_accounts_description')}</Text>
        <div class="flex justify-end">
          <Button size="small" variant="outline" color="warning" onclick={handleUnlinkAllOAuthAccounts}
            >{$t('admin.unlink_all_oauth_accounts')}</Button
          >
        </div>
      </div>
    </Alert>

    <Text>
      <FormatMessage key="admin.oauth_settings_more_details">
        {#snippet children({ message })}
          <a href="https://docs.immich.app/administration/oauth" class="underline" target="_blank" rel="noreferrer">
            {message}
          </a>
        {/snippet}
      </FormatMessage>
    </Text>

    <Field label={$t('admin.oauth_enable_description')} {disabled}>
      <Switch bind:checked={configToEdit.oauth.enabled} />
    </Field>

    <Field label="ISSUER_URL" required disabled={disabled || !configToEdit.oauth.enabled}>
      <Input bind:value={configToEdit.oauth.issuerUrl} />
    </Field>

    <Field label="CLIENT_ID" required disabled={disabled || !configToEdit.oauth.enabled}>
      <Input bind:value={configToEdit.oauth.clientId} />
    </Field>

    <Field label="CLIENT_SECRET" required disabled={disabled || !configToEdit.oauth.enabled}>
      <Input bind:value={configToEdit.oauth.clientSecret} />
    </Field>

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

    <Field label="SCOPE" required disabled={disabled || !configToEdit.oauth.enabled}>
      <Input bind:value={configToEdit.oauth.scope} />
    </Field>

    <Field label="ID_TOKEN_SIGNED_RESPONSE_ALG" required disabled={disabled || !configToEdit.oauth.enabled}>
      <Input bind:value={configToEdit.oauth.signingAlgorithm} />
    </Field>

    <Field label="USERINFO_SIGNED_RESPONSE_ALG" required disabled={disabled || !configToEdit.oauth.enabled}>
      <Input bind:value={configToEdit.oauth.profileSigningAlgorithm} />
    </Field>

    <Field
      label={$t('admin.oauth_timeout')}
      description={$t('admin.oauth_timeout_description')}
      required
      disabled={disabled || !configToEdit.oauth.enabled}
    >
      <NumberInput bind:value={configToEdit.oauth.timeout} />
    </Field>

    <Field
      label={$t('admin.oauth_storage_label_claim')}
      description={$t('admin.oauth_storage_label_claim_description')}
      required
      disabled={disabled || !configToEdit.oauth.enabled}
    >
      <Input bind:value={configToEdit.oauth.storageLabelClaim} />
    </Field>

    <Field
      label={$t('admin.oauth_role_claim')}
      description={$t('admin.oauth_role_claim_description')}
      required
      disabled={disabled || !configToEdit.oauth.enabled}
    >
      <Input bind:value={configToEdit.oauth.roleClaim} />
    </Field>

    <Field
      label={$t('admin.oauth_storage_quota_claim')}
      description={$t('admin.oauth_storage_quota_claim_description')}
      required
      disabled={disabled || !configToEdit.oauth.enabled}
    >
      <Input bind:value={configToEdit.oauth.storageQuotaClaim} />
    </Field>

    <Field
      label={$t('admin.oauth_storage_quota_default')}
      description={$t('admin.oauth_storage_quota_default_description')}
      disabled={disabled || !configToEdit.oauth.enabled}
    >
      <NumberInput
        bind:value={
          () => configToEdit.oauth.defaultStorageQuota ?? undefined,
          (value) => (configToEdit.oauth.defaultStorageQuota = value ?? null)
        }
      />
    </Field>

    <Field label={$t('admin.oauth_button_text')} disabled={disabled || !configToEdit.oauth.enabled}>
      <Input bind:value={configToEdit.oauth.buttonText} />
    </Field>

    <Field
      label={$t('admin.oauth_auto_register')}
      description={$t('admin.oauth_auto_register_description')}
      disabled={disabled || !configToEdit.oauth.enabled}
    >
      <Switch bind:checked={configToEdit.oauth.autoRegister} />
    </Field>

    <Field
      label={$t('admin.oauth_auto_launch')}
      description={$t('admin.oauth_auto_launch_description')}
      disabled={disabled || !configToEdit.oauth.enabled}
    >
      <Switch bind:checked={configToEdit.oauth.autoLaunch} />
    </Field>

    <Field
      label={$t('admin.oauth_mobile_redirect_uri_override')}
      description={$t('admin.oauth_mobile_redirect_uri_override_description', {
        values: { callback: 'app.immich:///oauth-callback' },
      })}
      disabled={disabled || !configToEdit.oauth.enabled}
    >
      <Switch
        bind:checked={configToEdit.oauth.mobileOverrideEnabled}
        onCheckedChange={() => handleToggleOverride(configToEdit)}
      />
    </Field>

    {#if configToEdit.oauth.mobileOverrideEnabled}
      <Field label={$t('admin.oauth_mobile_redirect_uri')} required disabled={disabled || !configToEdit.oauth.enabled}>
        <Input bind:value={configToEdit.oauth.mobileRedirectUri} />
      </Field>
    {/if}
  {/snippet}
</SystemSettingsModal>
