<script lang="ts">
  import TemplateSettings from '$lib/components/admin-page/settings/template-settings/template-settings.svelte';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import { user } from '$lib/stores/user.store';
  import { handleError } from '$lib/utils/handle-error';
  import { sendTestEmail, type SystemConfigDto } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import { isEqual } from 'lodash-es';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';

  interface Props {
    savedConfig: SystemConfigDto;
    defaultConfig: SystemConfigDto;
    config: SystemConfigDto;
    disabled?: boolean;
    onReset: SettingsResetEvent;
    onSave: SettingsSaveEvent;
  }

  let { savedConfig, defaultConfig, config = $bindable(), disabled = false, onReset, onSave }: Props = $props();

  let isSending = $state(false);

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

  const onsubmit = (event: Event) => {
    event.preventDefault();
  };
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" {onsubmit} class="mt-4">
      <div class="flex flex-col gap-4">
        <SettingAccordion key="email" title={$t('email')} subtitle={$t('admin.notification_email_setting_description')}>
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title={$t('admin.notification_enable_email_notifications')}
              {disabled}
              bind:checked={config.notifications.smtp.enabled}
            />

            <hr />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              required
              label={$t('host')}
              description={$t('admin.notification_email_host_description')}
              disabled={disabled || !config.notifications.smtp.enabled}
              bind:value={config.notifications.smtp.transport.host}
              isEdited={config.notifications.smtp.transport.host !== savedConfig.notifications.smtp.transport.host}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              required
              label={$t('port')}
              description={$t('admin.notification_email_port_description')}
              disabled={disabled || !config.notifications.smtp.enabled}
              bind:value={config.notifications.smtp.transport.port}
              isEdited={config.notifications.smtp.transport.port !== savedConfig.notifications.smtp.transport.port}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label={$t('username')}
              description={$t('admin.notification_email_username_description')}
              disabled={disabled || !config.notifications.smtp.enabled}
              bind:value={config.notifications.smtp.transport.username}
              isEdited={config.notifications.smtp.transport.username !==
                savedConfig.notifications.smtp.transport.username}
            />

            <SettingInputField
              inputType={SettingInputFieldType.PASSWORD}
              label={$t('password')}
              description={$t('admin.notification_email_password_description')}
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

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              required
              label={$t('admin.notification_email_from_address')}
              description={$t('admin.notification_email_from_address_description')}
              disabled={disabled || !config.notifications.smtp.enabled}
              bind:value={config.notifications.smtp.from}
              isEdited={config.notifications.smtp.from !== savedConfig.notifications.smtp.from}
            />

            <div class="flex gap-2 place-items-center">
              <Button
                size="small"
                shape="round"
                disabled={!config.notifications.smtp.enabled}
                onclick={handleSendTestEmail}
              >
                {#if disabled}
                  {$t('admin.notification_email_test_email')}
                {:else}
                  {$t('admin.notification_email_sent_test_email_button')}
                {/if}
              </Button>
              {#if isSending}
                <LoadingSpinner />
              {/if}
            </div>
          </div>
        </SettingAccordion>
      </div>
    </form>
  </div>
  <TemplateSettings {defaultConfig} {config} {savedConfig} {onReset} {onSave} />

  <SettingButtonsRow
    onReset={(options) => onReset({ ...options, configKeys: ['notifications', 'templates'] })}
    onSave={() => onSave({ notifications: config.notifications, templates: config.templates })}
    showResetToDefault={!isEqual(savedConfig, defaultConfig)}
    {disabled}
  />
</div>
