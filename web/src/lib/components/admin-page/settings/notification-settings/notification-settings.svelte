<script lang="ts">
  import type { SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { SettingsEventType } from '../admin-settings';
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';

  export let savedConfig: SystemConfigDto;
  export let defaultConfig: SystemConfigDto;
  export let config: SystemConfigDto; // this is the config that is being edited
  export let disabled = false;

  const dispatch = createEventDispatcher<SettingsEventType>();
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault class="mt-4">
      <div class="flex flex-col gap-4">
        <SettingAccordion key="email" title="Email" subtitle="Settings for sending email notifications">
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              id="enable-smtp"
              title="Enabled"
              subtitle="Enable email notifications"
              {disabled}
              bind:checked={config.notifications.smtp.enabled}
            />

            <hr />
            <SettingSwitch
              id="enable-ignore-cert"
              title="Ignore certificate"
              subtitle="Do not check certificate validity"
              {disabled}
              bind:checked={config.notifications.smtp.ignoreCert}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              required
              label="Host"
              desc="Host of the email server; When using SSL instead of TLS  use the prefix smtps://"
              disabled={disabled || !config.notifications.smtp.enabled}
              bind:value={config.notifications.smtp.transport.host}
              isEdited={config.notifications.smtp.transport.host !== savedConfig.notifications.smtp.transport.host}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              required
              label="Port"
              desc="Port of the email server; common ports: 25, 465, 587"
              disabled={disabled || !config.notifications.smtp.enabled}
              bind:value={config.notifications.smtp.transport.port}
              isEdited={config.notifications.smtp.transport.port !== savedConfig.notifications.smtp.transport.port}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label="Username"
              desc="The username used to login to the email server"
              disabled={disabled || !config.notifications.smtp.enabled}
              bind:value={config.notifications.smtp.transport.username}
              isEdited={config.notifications.smtp.transport.username !==
                savedConfig.notifications.smtp.transport.username}
            />

            <SettingInputField
              inputType={SettingInputFieldType.PASSWORD}
              label="Password"
              desc="The password used to login to the email server"
              disabled={disabled || !config.notifications.smtp.enabled}
              bind:value={config.notifications.smtp.transport.password}
              isEdited={config.notifications.smtp.transport.password !==
                savedConfig.notifications.smtp.transport.password}
            />

            <hr />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              required
              label="From address"
              desc="Sender email address, for example: &quot;Immich Photo Server <noreply@mydomain.com>&quot;"
              disabled={disabled || !config.notifications.smtp.enabled}
              bind:value={config.notifications.smtp.from}
              isEdited={config.notifications.smtp.from !== savedConfig.notifications.smtp.from}
            />
          </div>
        </SettingAccordion>
      </div>

      <SettingButtonsRow
        on:reset={({ detail }) => dispatch('reset', { ...detail, configKeys: ['notifications'] })}
        on:save={() => dispatch('save', { notifications: config.notifications })}
        showResetToDefault={!isEqual(savedConfig, defaultConfig)}
        {disabled}
      />
    </form>
  </div>
</div>
