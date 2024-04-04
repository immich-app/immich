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

  export let savedConfig: SystemConfigDto;
  export let defaultConfig: SystemConfigDto;
  export let config: SystemConfigDto; // this is the config that is being edited
  export let disabled = false;

  const dispatch = createEventDispatcher<SettingsEventType>();
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault class="mt-4 ml-4">
      <div class="flex flex-col gap-4" >
        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label="SMTP Host"
          desc="SMTP host of the MTA server; When using SSL instead of TLS  use the prefix smtps://"
          bind:value={config.smtp.transport.host}
          isEdited={config.smtp.transport.host !== savedConfig.smtp.transport.host}
        />

        <hr />

        <SettingInputField
          inputType={SettingInputFieldType.NUMBER}
          label="SMTP port"
          desc="SMTP port of the MTA server; common ports: 25, 465, 587"
          bind:value={config.smtp.transport.port}
          isEdited={config.smtp.transport.port !== savedConfig.smtp.transport.port}
        />

        <hr />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label="SMTP username"
          desc="The username used to login to the MTA server."
          bind:value={config.smtp.transport.username}
          isEdited={config.smtp.transport.username !== savedConfig.smtp.transport.username}
        />

        <hr />

        <SettingInputField
          inputType={SettingInputFieldType.PASSWORD}
          label="SMTP password"
          desc="The password used to login to the MTA server."
          bind:value={config.smtp.transport.password}
          isEdited={config.smtp.transport.password !== savedConfig.smtp.transport.password}
        />

        <hr />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label="SMTP From Header"
          desc="Sender email address, for example: &quot;Immich Photo Server <noreply@mydomain.com>&quot;"
          bind:value={config.smtp.defaults.from}
          isEdited={config.smtp.defaults.from !== savedConfig.smtp.defaults.from}
        />

        <div class="ml-4">
          <SettingButtonsRow
            on:reset={({ detail }) => dispatch('reset', { ...detail, configKeys: ['smtp'] })}
            on:save={() => dispatch('save', { smtp: config.smtp })}
            showResetToDefault={!isEqual(savedConfig, defaultConfig)}
            {disabled}
          />
        </div>
      </div>
    </form>
  </div>
</div>
