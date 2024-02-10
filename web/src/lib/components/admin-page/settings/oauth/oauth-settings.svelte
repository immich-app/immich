<script lang="ts">
  import type { SystemConfigDto } from '@api';
  import { isEqual } from 'lodash-es';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { SettingsEventType } from '../admin-settings';
  import ConfirmDisableLogin from '../confirm-disable-login.svelte';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
  import SettingSwitch from '../setting-switch.svelte';

  export let savedConfig: SystemConfigDto;
  export let defaultConfig: SystemConfigDto;
  export let config: SystemConfigDto; // this is the config that is being edited
  export let disabled = false;

  const dispatch = createEventDispatcher<SettingsEventType>();

  const handleToggleOverride = () => {
    // click runs before bind
    const previouslyEnabled = config.oauth.mobileOverrideEnabled;
    if (!previouslyEnabled && !config.oauth.mobileRedirectUri) {
      config.oauth.mobileRedirectUri = window.location.origin + '/api/oauth/mobile-redirect';
    }
  };

  let isConfirmOpen = false;
  let handleConfirm: (value: boolean) => void;

  const openConfirmModal = () => {
    return new Promise((resolve) => {
      handleConfirm = (value: boolean) => {
        isConfirmOpen = false;
        resolve(value);
      };
      isConfirmOpen = true;
    });
  };

  const handleSave = async () => {
    if (!savedConfig.passwordLogin.enabled && savedConfig.oauth.enabled && !config.oauth.enabled) {
      const confirmed = await openConfirmModal();
      if (!confirmed) {
        return;
      }
    }

    if (!config.oauth.mobileOverrideEnabled) {
      config.oauth.mobileRedirectUri = '';
    }

    dispatch('save', { oauth: config.oauth });
  };
</script>

{#if isConfirmOpen}
  <ConfirmDisableLogin on:cancel={() => handleConfirm(false)} on:confirm={() => handleConfirm(true)} />
{/if}

<div class="mt-2">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault class="mx-4 flex flex-col gap-4 py-4">
      <p class="text-sm dark:text-immich-dark-fg">
        For more details about this feature, refer to the <a
          href="https://immich.app/docs/administration/oauth"
          class="underline"
          target="_blank"
          rel="noreferrer">docs</a
        >.
      </p>

      <SettingSwitch {disabled} title="ENABLE" subtitle="Login with OAuth" bind:checked={config.oauth.enabled} />

      {#if config.oauth.enabled}
        <hr />
        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label="ISSUER URL"
          bind:value={config.oauth.issuerUrl}
          required={true}
          disabled={disabled || !config.oauth.enabled}
          isEdited={!(config.oauth.issuerUrl == savedConfig.oauth.issuerUrl)}
        />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label="CLIENT ID"
          bind:value={config.oauth.clientId}
          required={true}
          disabled={disabled || !config.oauth.enabled}
          isEdited={!(config.oauth.clientId == savedConfig.oauth.clientId)}
        />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label="CLIENT SECRET"
          bind:value={config.oauth.clientSecret}
          required={true}
          disabled={disabled || !config.oauth.enabled}
          isEdited={!(config.oauth.clientSecret == savedConfig.oauth.clientSecret)}
        />

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
          label="SIGNING ALGORITHM"
          bind:value={config.oauth.signingAlgorithm}
          required={true}
          disabled={disabled || !config.oauth.enabled}
          isEdited={!(config.oauth.signingAlgorithm == savedConfig.oauth.signingAlgorithm)}
        />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label="STORAGE LABEL CLAIM"
          desc="Automatically set the user's storage label to the value of this claim."
          bind:value={config.oauth.storageLabelClaim}
          required={true}
          disabled={disabled || !config.oauth.enabled}
          isEdited={!(config.oauth.storageLabelClaim == savedConfig.oauth.storageLabelClaim)}
        />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label="BUTTON TEXT"
          bind:value={config.oauth.buttonText}
          required={false}
          disabled={disabled || !config.oauth.enabled}
          isEdited={!(config.oauth.buttonText == savedConfig.oauth.buttonText)}
        />

        <SettingSwitch
          title="AUTO REGISTER"
          subtitle="Automatically register new users after signing in with OAuth"
          bind:checked={config.oauth.autoRegister}
          disabled={disabled || !config.oauth.enabled}
        />

        <SettingSwitch
          title="AUTO LAUNCH"
          subtitle="Start the OAuth login flow automatically upon navigating to the login page"
          disabled={disabled || !config.oauth.enabled}
          bind:checked={config.oauth.autoLaunch}
        />

        <SettingSwitch
          title="MOBILE REDIRECT URI OVERRIDE"
          subtitle="Enable when 'app.immich:/' is an invalid redirect URI."
          disabled={disabled || !config.oauth.enabled}
          on:click={() => handleToggleOverride()}
          bind:checked={config.oauth.mobileOverrideEnabled}
        />

        {#if config.oauth.mobileOverrideEnabled}
          <SettingInputField
            inputType={SettingInputFieldType.TEXT}
            label="MOBILE REDIRECT URI"
            bind:value={config.oauth.mobileRedirectUri}
            required={true}
            disabled={disabled || !config.oauth.enabled}
            isEdited={!(config.oauth.mobileRedirectUri == savedConfig.oauth.mobileRedirectUri)}
          />
        {/if}
      {/if}

      <SettingButtonsRow
        on:reset={({ detail }) => dispatch('reset', { ...detail, configKeys: ['oauth'] })}
        on:save={() => handleSave()}
        showResetToDefault={!isEqual(savedConfig.oauth, defaultConfig.oauth)}
        {disabled}
      />
    </form>
  </div>
</div>
