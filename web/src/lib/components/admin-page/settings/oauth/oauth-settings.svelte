<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import type { SystemConfigDto, SystemConfigOAuthDto } from '@api';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import ConfirmDisableLogin from '../confirm-disable-login.svelte';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
  import SettingSwitch from '../setting-switch.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    save: SystemConfigOAuthDto;
  }>();

  export let config: SystemConfigDto;
  export let oauthConfig: SystemConfigOAuthDto;
  export let oauthDefault: SystemConfigOAuthDto;
  export let savedConfig: SystemConfigOAuthDto;

  const handleToggleOverride = () => {
    // click runs before bind
    const previouslyEnabled = oauthConfig.mobileOverrideEnabled;
    if (!previouslyEnabled && !oauthConfig.mobileRedirectUri) {
      oauthConfig.mobileRedirectUri = window.location.origin + '/api/oauth/mobile-redirect';
    }
  };
  async function reset() {
    oauthConfig = { ...savedConfig };

    notificationController.show({
      message: 'Reset OAuth settings to the last saved settings',
      type: NotificationType.Info,
    });
  }

  let isConfirmOpen = false;
  let handleConfirm: (value: boolean) => void;

  const openConfirmModal = () => {
    return new Promise((resolve) => {
      handleConfirm = (value: boolean) => {
        if (!value) {
          oauthConfig.enabled = !oauthConfig.enabled;
        }
        isConfirmOpen = false;
        resolve(value);
      };
      isConfirmOpen = true;
    });
  };

  async function saveSetting() {
    if (!config.passwordLogin.enabled && savedConfig.enabled && !oauthConfig.enabled) {
      const confirmed = await openConfirmModal();
      if (!confirmed) {
        return;
      }
    }

    if (!oauthConfig.mobileOverrideEnabled) {
      oauthConfig.mobileRedirectUri = '';
    }

    dispatch('save', oauthConfig);
  }

  async function resetToDefault() {
    oauthConfig = { ...oauthDefault };

    notificationController.show({
      message: 'Reset OAuth settings to default',
      type: NotificationType.Info,
    });
  }
</script>

{#if isConfirmOpen}
  <ConfirmDisableLogin on:cancel={() => handleConfirm(false)} on:confirm={() => handleConfirm(true)} />
{/if}

<div class="mt-2">
  <div in:fade={{ duration: 300 }}>
    <form autocomplete="off" on:submit|preventDefault class="mx-4 flex flex-col gap-4 py-4">
      <p class="text-sm dark:text-immich-dark-fg">
        For more details about this feature, refer to the <a
          href="http://immich.app/docs/administration/oauth#mobile-redirect-uri"
          class="underline"
          target="_blank"
          rel="noreferrer">docs</a
        >.
      </p>

      <SettingSwitch title="ENABLE" bind:checked={oauthConfig.enabled} />
      <hr />
      <SettingInputField
        inputType={SettingInputFieldType.TEXT}
        label="ISSUER URL"
        bind:value={oauthConfig.issuerUrl}
        required={true}
        disabled={!oauthConfig.enabled}
        isEdited={!(oauthConfig.issuerUrl == savedConfig.issuerUrl)}
      />

      <SettingInputField
        inputType={SettingInputFieldType.TEXT}
        label="CLIENT ID"
        bind:value={oauthConfig.clientId}
        required={true}
        disabled={!oauthConfig.enabled}
        isEdited={!(oauthConfig.clientId == savedConfig.clientId)}
      />

      <SettingInputField
        inputType={SettingInputFieldType.TEXT}
        label="CLIENT SECRET"
        bind:value={oauthConfig.clientSecret}
        required={true}
        disabled={!oauthConfig.enabled}
        isEdited={!(oauthConfig.clientSecret == savedConfig.clientSecret)}
      />

      <SettingInputField
        inputType={SettingInputFieldType.TEXT}
        label="SCOPE"
        bind:value={oauthConfig.scope}
        required={true}
        disabled={!oauthConfig.enabled}
        isEdited={!(oauthConfig.scope == savedConfig.scope)}
      />

      <SettingInputField
        inputType={SettingInputFieldType.TEXT}
        label="STORAGE LABEL CLAIM"
        desc="Automatically set the user's storage label to the value of this claim."
        bind:value={oauthConfig.storageLabelClaim}
        required={true}
        disabled={!oauthConfig.storageLabelClaim}
        isEdited={!(oauthConfig.storageLabelClaim == savedConfig.storageLabelClaim)}
      />

      <SettingInputField
        inputType={SettingInputFieldType.TEXT}
        label="BUTTON TEXT"
        bind:value={oauthConfig.buttonText}
        required={false}
        disabled={!oauthConfig.enabled}
        isEdited={!(oauthConfig.buttonText == savedConfig.buttonText)}
      />

      <SettingSwitch
        title="AUTO REGISTER"
        subtitle="Automatically register new users after signing in with OAuth"
        bind:checked={oauthConfig.autoRegister}
        disabled={!oauthConfig.enabled}
      />

      <SettingSwitch
        title="AUTO LAUNCH"
        subtitle="Start the OAuth login flow automatically upon navigating to the login page"
        disabled={!oauthConfig.enabled}
        bind:checked={oauthConfig.autoLaunch}
      />

      <SettingSwitch
        title="MOBILE REDIRECT URI OVERRIDE"
        subtitle="Enable when `app.immich:/` is an invalid redirect URI."
        disabled={!oauthConfig.enabled}
        on:click={() => handleToggleOverride()}
        bind:checked={oauthConfig.mobileOverrideEnabled}
      />

      {#if oauthConfig.mobileOverrideEnabled}
        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label="MOBILE REDIRECT URI"
          bind:value={oauthConfig.mobileRedirectUri}
          required={true}
          disabled={!oauthConfig.enabled}
          isEdited={!(oauthConfig.mobileRedirectUri == savedConfig.mobileRedirectUri)}
        />
      {/if}

      <SettingButtonsRow
        on:reset={reset}
        on:save={saveSetting}
        on:reset-to-default={resetToDefault}
        showResetToDefault={!isEqual(oauthConfig, oauthDefault)}
      />
    </form>
  </div>
</div>
