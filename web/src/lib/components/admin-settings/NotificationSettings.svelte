<script lang="ts">
  import TemplateSettings from '$lib/components/admin-settings/TemplateSettings.svelte';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { handleSystemConfigSave } from '$lib/services/system-config.service';
  import { user } from '$lib/stores/user.store';
  import { handleError } from '$lib/utils/handle-error';
  import { sendTestEmailAdmin } from '@immich/sdk';
  import { Button, LoadingSpinner, toastManager } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const disabled = $derived(featureFlagsManager.value.configFile);
  const config = $derived(systemConfigManager.value);
  let configToEdit = $state(systemConfigManager.cloneValue());

  let isSending = $state(false);

  const handleSendTestEmail = async () => {
    if (isSending) {
      return;
    }

    isSending = true;

    try {
      await sendTestEmailAdmin({
        systemConfigSmtpDto: {
          enabled: configToEdit.notifications.smtp.enabled,
          transport: {
            host: configToEdit.notifications.smtp.transport.host,
            port: configToEdit.notifications.smtp.transport.port,
            secure: configToEdit.notifications.smtp.transport.secure,
            username: configToEdit.notifications.smtp.transport.username,
            password: configToEdit.notifications.smtp.transport.password,
            ignoreCert: configToEdit.notifications.smtp.transport.ignoreCert,
          },
          from: configToEdit.notifications.smtp.from,
          replyTo: configToEdit.notifications.smtp.from,
        },
      });

      toastManager.success($t('admin.notification_email_test_email_sent', { values: { email: $user.email } }));

      if (!disabled) {
        await handleSystemConfigSave({ notifications: configToEdit.notifications });
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
    <form autocomplete="off" class="mt-4" onsubmit={(event) => event.preventDefault()}>
      <div class="flex flex-col gap-4">
        <SettingAccordion key="email" title={$t('email')} subtitle={$t('admin.notification_email_setting_description')}>
          <div class="ms-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title={$t('admin.notification_enable_email_notifications')}
              {disabled}
              bind:checked={configToEdit.notifications.smtp.enabled}
            />

            <hr />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              required
              label={$t('host')}
              description={$t('admin.notification_email_host_description')}
              disabled={disabled || !configToEdit.notifications.smtp.enabled}
              bind:value={configToEdit.notifications.smtp.transport.host}
              isEdited={configToEdit.notifications.smtp.transport.host !== config.notifications.smtp.transport.host}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              required
              label={$t('port')}
              description={$t('admin.notification_email_port_description')}
              disabled={disabled || !configToEdit.notifications.smtp.enabled}
              bind:value={configToEdit.notifications.smtp.transport.port}
              isEdited={configToEdit.notifications.smtp.transport.port !== config.notifications.smtp.transport.port}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label={$t('username')}
              description={$t('admin.notification_email_username_description')}
              disabled={disabled || !configToEdit.notifications.smtp.enabled}
              bind:value={configToEdit.notifications.smtp.transport.username}
              isEdited={configToEdit.notifications.smtp.transport.username !==
                config.notifications.smtp.transport.username}
            />

            <SettingInputField
              inputType={SettingInputFieldType.PASSWORD}
              label={$t('password')}
              description={$t('admin.notification_email_password_description')}
              disabled={disabled || !configToEdit.notifications.smtp.enabled}
              bind:value={configToEdit.notifications.smtp.transport.password}
              isEdited={configToEdit.notifications.smtp.transport.password !==
                config.notifications.smtp.transport.password}
            />

            <SettingSwitch
              title={$t('admin.notification_email_secure')}
              subtitle={$t('admin.notification_email_secure_description')}
              disabled={disabled || !configToEdit.notifications.smtp.enabled}
              bind:checked={configToEdit.notifications.smtp.transport.secure}
            />

            <SettingSwitch
              title={$t('admin.notification_email_ignore_certificate_errors')}
              subtitle={$t('admin.notification_email_ignore_certificate_errors_description')}
              disabled={disabled || !configToEdit.notifications.smtp.enabled}
              bind:checked={configToEdit.notifications.smtp.transport.ignoreCert}
            />

            <hr />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              required
              label={$t('admin.notification_email_from_address')}
              description={$t('admin.notification_email_from_address_description')}
              disabled={disabled || !configToEdit.notifications.smtp.enabled}
              bind:value={configToEdit.notifications.smtp.from}
              isEdited={configToEdit.notifications.smtp.from !== config.notifications.smtp.from}
            />

            <div class="flex gap-2 place-items-center">
              <Button
                size="small"
                shape="round"
                disabled={!configToEdit.notifications.smtp.enabled}
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
  <TemplateSettings bind:config={configToEdit} />

  <SettingButtonsRow bind:configToEdit keys={['notifications', 'templates']} {disabled} />
</div>
