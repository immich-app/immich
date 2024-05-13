<script lang="ts">
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { type SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { SettingsEventType } from '../admin-settings';

  export let savedConfig: SystemConfigDto;
  export let defaultConfig: SystemConfigDto;
  export let config: SystemConfigDto; // this is the config that is being edited
  export let disabled = false;

  const dispatch = createEventDispatcher<SettingsEventType>();

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
    dispatch('save', { passwordLogin: config.passwordLogin, oauth: config.oauth });
  };
</script>

{#if isConfirmOpen}
  <ConfirmDialogue
    id="disable-login-modal"
    title="Disable login"
    onClose={() => (isConfirmOpen = false)}
    onConfirm={() => handleSave(true)}
  >
    <svelte:fragment slot="prompt">
      <div class="flex flex-col gap-4">
        <p>Are you sure you want to disable all login methods? Login will be completely disabled.</p>
        <p>
          To re-enable, use a
          <a
            href="https://immich.app/docs/administration/server-commands"
            rel="noreferrer"
            target="_blank"
            class="underline"
          >
            Server Command</a
          >.
        </p>
      </div>
    </svelte:fragment>
  </ConfirmDialogue>
{/if}

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="ml-4 mt-4 flex flex-col gap-4">
        <SettingAccordion key="oauth" title="OAuth" subtitle="Manage OAuth login settings">
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <p class="text-sm dark:text-immich-dark-fg">
              For more details about this feature, refer to the <a
                href="https://immich.app/docs/administration/oauth"
                class="underline"
                target="_blank"
                rel="noreferrer">docs</a
              >.
            </p>

            <SettingSwitch
              id="login-with-oauth"
              {disabled}
              title="ENABLE"
              subtitle="Login with OAuth"
              bind:checked={config.oauth.enabled}
            />

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
                label="STORAGE QUOTA CLAIM"
                desc="Automatically set the user's storage quota to the value of this claim."
                bind:value={config.oauth.storageQuotaClaim}
                required={true}
                disabled={disabled || !config.oauth.enabled}
                isEdited={!(config.oauth.storageQuotaClaim == savedConfig.oauth.storageQuotaClaim)}
              />

              <SettingInputField
                inputType={SettingInputFieldType.NUMBER}
                label="DEFAULT STORAGE QUOTA (GiB)"
                desc="Quota in GiB to be used when no claim is provided (Enter 0 for unlimited quota)."
                bind:value={config.oauth.defaultStorageQuota}
                required={true}
                disabled={disabled || !config.oauth.enabled}
                isEdited={!(config.oauth.defaultStorageQuota == savedConfig.oauth.defaultStorageQuota)}
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
                id="auto-register-new-users"
                title="AUTO REGISTER"
                subtitle="Automatically register new users after signing in with OAuth"
                bind:checked={config.oauth.autoRegister}
                disabled={disabled || !config.oauth.enabled}
              />

              <SettingSwitch
                id="auto-launch-oauth"
                title="AUTO LAUNCH"
                subtitle="Start the OAuth login flow automatically upon navigating to the login page"
                disabled={disabled || !config.oauth.enabled}
                bind:checked={config.oauth.autoLaunch}
              />

              <SettingSwitch
                id="mobile-redirect-uri-override"
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
          </div>
        </SettingAccordion>

        <SettingAccordion key="password" title="Password" subtitle="Manage password login settings">
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <div class="ml-4 mt-4 flex flex-col">
              <SettingSwitch
                id="enable-password-login"
                title="ENABLED"
                {disabled}
                subtitle="Login with email and password"
                bind:checked={config.passwordLogin.enabled}
              />
            </div>
          </div>
        </SettingAccordion>

        <SettingButtonsRow
          showResetToDefault={!isEqual(savedConfig.passwordLogin, defaultConfig.passwordLogin) ||
            !isEqual(savedConfig.oauth, defaultConfig.oauth)}
          {disabled}
          on:reset={({ detail }) => dispatch('reset', { ...detail, configKeys: ['passwordLogin', 'oauth'] })}
          on:save={() => handleSave(false)}
        />
      </div>
    </form>
  </div>
</div>
