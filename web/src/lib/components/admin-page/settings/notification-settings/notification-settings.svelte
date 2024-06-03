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
  import { t } from 'svelte-i18n';

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
        <SettingAccordion key="email" title={$t('email')} subtitle="{ $t("placeholder_86") }">
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title={$t('enabled')}
              subtitle={$t('enable_email_notifications')}
              {disabled}
              bind:checked={config.notifications.smtp.enabled}
            />

            <hr />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              required
              label={$t('host')}
              desc="{ $t("placeholder_12") }"
              disabled={disabled || !config.notifications.smtp.enabled}
              bind:value={config.notifications.smtp.transport.host}
              isEdited={config.notifications.smtp.transport.host !== savedConfig.notifications.smtp.transport.host}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              required
              label={$t('port')}
              desc="{ $t("placeholder_25") }"
              disabled={disabled || !config.notifications.smtp.enabled}
              bind:value={config.notifications.smtp.transport.port}
              isEdited={config.notifications.smtp.transport.port !== savedConfig.notifications.smtp.transport.port}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label={$t('username')}
              desc="{ $t("placeholder_39") }"
              disabled={disabled || !config.notifications.smtp.enabled}
              bind:value={config.notifications.smtp.transport.username}
              isEdited={config.notifications.smtp.transport.username !==
                savedConfig.notifications.smtp.transport.username}
            />

            <SettingInputField
              inputType={SettingInputFieldType.PASSWORD}
              label={$t('password')}
              desc="{ $t("placeholder_23") }"
              disabled={disabled || !config.notifications.smtp.enabled}
              bind:value={config.notifications.smtp.transport.password}
              isEdited={config.notifications.smtp.transport.password !==
                savedConfig.notifications.smtp.transport.password}
            />

            <SettingSwitch
              title={$t('ignore_certificate_errors')}
              subtitle="{ $t("placeholder_79") }"
              disabled={disabled || !config.notifications.smtp.enabled}
              bind:checked={config.notifications.smtp.transport.ignoreCert}
            />

            <hr />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              required
              label={$t('from_address')}
              desc="{ $t("placeholder_29") }"
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
