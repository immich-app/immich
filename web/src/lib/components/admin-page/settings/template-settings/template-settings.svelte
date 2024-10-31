<script lang="ts">
  import { sendTestEmail, type SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { t } from 'svelte-i18n';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { user } from '$lib/stores/user.store';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import SettingTextarea from '$lib/components/shared-components/settings/setting-textarea.svelte';

  export let savedConfig: SystemConfigDto;
  export let defaultConfig: SystemConfigDto;
  export let config: SystemConfigDto; // this is the config that is being edited
  export let disabled = false;
  export let onReset: SettingsResetEvent;
  export let onSave: SettingsSaveEvent;

  let isSending = false;

  const handleSendTestEmail = async () => {
    if (isSending) {
      return;
    }

    isSending = true;

    try {
      await sendTestEmail({
        systemConfigSmtpDto: {
          enabled: config.notifications.smtp.enabled,
          transport: {
            host: config.notifications.smtp.transport.host,
            port: config.notifications.smtp.transport.port,
            username: config.notifications.smtp.transport.username,
            password: config.notifications.smtp.transport.password,
            ignoreCert: config.notifications.smtp.transport.ignoreCert,
          },
          from: config.notifications.smtp.from,
          replyTo: config.notifications.smtp.from,
        },
      });

      notificationController.show({
        type: NotificationType.Info,
        message: $t('admin.notification_email_test_email_sent', { values: { email: $user.email } }),
      });

      if (!disabled) {
        onSave({ notifications: config.notifications });
      }
    } catch (error) {
      handleError(error, $t('admin.notification_email_test_email_failed'));
    } finally {
      isSending = false;
    }
  };
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault class="mt-4">
      <div class="flex flex-col gap-4">
        <SettingAccordion
          key="templates"
          title={$t('emailtemplates')}
          subtitle={$t('admin.tempalates_emails_description')}
        >
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              required
              label={$t('host')}
              desc={$t('admin.notification_email_host_description')}
              disabled={disabled || !config.notifications.smtp.enabled}
              bind:value={config.notifications.smtp.transport.host}
              isEdited={config.notifications.smtp.transport.host !== savedConfig.notifications.smtp.transport.host}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              required
              label={$t('port')}
              desc={$t('admin.notification_email_port_description')}
              disabled={disabled || !config.notifications.smtp.enabled}
              bind:value={config.notifications.smtp.transport.port}
              isEdited={config.notifications.smtp.transport.port !== savedConfig.notifications.smtp.transport.port}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label={$t('username')}
              desc={$t('admin.notification_email_username_description')}
              disabled={disabled || !config.notifications.smtp.enabled}
              bind:value={config.notifications.smtp.transport.username}
              isEdited={config.notifications.smtp.transport.username !==
                savedConfig.notifications.smtp.transport.username}
            />

            <SettingInputField
              inputType={SettingInputFieldType.PASSWORD}
              label={$t('password')}
              desc={$t('admin.notification_email_password_description')}
              disabled={disabled || !config.notifications.smtp.enabled}
              bind:value={config.notifications.smtp.transport.password}
              isEdited={config.notifications.smtp.transport.password !==
                savedConfig.notifications.smtp.transport.password}
            />

            <SettingSwitch
              title={$t('admin.notification_email_ignore_certificate_errors')}
              subtitle={$t('admin.notification_email_ignore_certificate_errors_description')}
              disabled={disabled || !config.notifications.smtp.enabled}
              bind:checked={config.notifications.smtp.transport.ignoreCert}
            />

            <hr />

            <SettingTextarea             
            label={$t('admin.template_email_welcome')}
            desc={$t('admin.template_email_welcome_description')}
            disabled={disabled || !config.}
            bind:value={config.notifications.smtp.from}
            isEdited={config.notifications.smtp.from !== savedConfig.notifications.smtp.from} />

          </div>
        </SettingAccordion>
      </div>

      <SettingButtonsRow
        onReset={(options) => onReset({ ...options, configKeys: ['notifications'] })}
        onSave={() => onSave({ notifications: config.notifications })}
        showResetToDefault={!isEqual(savedConfig, defaultConfig)}
        {disabled}
      />
    </form>
  </div>
</div>
