<script lang="ts">
  import { cloneDeep } from 'lodash-es';
  import TemplateSettings from './TemplateSettings.svelte';
  import SettingAccordion from '#lib/components/shared-components/settings/SettingAccordion.svelte';
  import SettingInputField from '#lib/components/shared-components/settings/SettingInputField.svelte';
  import SettingSwitch from '#lib/components/shared-components/settings/SettingSwitch.svelte';
  import SettingButtonsRow from '#lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import { SettingInputFieldType } from '#lib/constants.ts';
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import { featureFlagsManager } from '#lib/managers/feature-flags-manager.svelte.ts';
  import { createPreloadedQuery, executeMutation } from '#lib/queries/client.ts';
  import { getAdminConfigQuery, updateAdminConfigMutation } from '#lib/queries/config-admin.query.ts';
  import { handleError } from '#lib/utils/handle-error.ts';
  import { sendTestAppriseAdmin, sendTestEmailAdmin } from '@immich/sdk';
  import { Button, toastManager } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const query = createPreloadedQuery(getAdminConfigQuery);
  const config = $derived(query.data);

  const disabled = $derived(featureFlagsManager.value.configFile);
  let configToEdit = $state(cloneDeep(config));

  let isSending = $state(false);

  const handleSendTestEmail = async () => {
    if (isSending) {
      return;
    }

    isSending = true;

    try {
      await sendTestEmailAdmin({
        adminConfigSmtpDto: {
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

      toastManager.primary(
        $t('admin.notification_email_test_email_sent', { values: { email: authManager.user.email } }),
      );

      if (!disabled) {
        await executeMutation(updateAdminConfigMutation, { notifications: configToEdit.notifications });
      }
    } catch (error) {
      handleError(error, $t('admin.notification_email_test_email_failed'));
    } finally {
      isSending = false;
    }
  };

  let isSendingApprise = $state(false);
  const appriseDisabled = $derived(disabled || !configToEdit.notifications.apprise.enabled);

  const handleSendTestApprise = async () => {
    if (isSendingApprise) {
      return;
    }

    isSendingApprise = true;

    try {
      await sendTestAppriseAdmin({ adminConfigAppriseDto: configToEdit.notifications.apprise });

      toastManager.primary($t('admin.notification_apprise_test_sent'));

      if (!disabled) {
        await executeMutation(updateAdminConfigMutation, { notifications: configToEdit.notifications });
      }
    } catch (error) {
      handleError(error, $t('admin.notification_apprise_test_failed'));
    } finally {
      isSendingApprise = false;
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

            <div class="flex place-items-center gap-2">
              <Button
                size="small"
                shape="round"
                loading={isSending}
                disabled={!configToEdit.notifications.smtp.enabled}
                onclick={handleSendTestEmail}
              >
                {#if disabled}
                  {$t('admin.notification_email_test_email')}
                {:else}
                  {$t('admin.notification_email_sent_test_email_button')}
                {/if}
              </Button>
            </div>
          </div>
        </SettingAccordion>

        <SettingAccordion
          key="apprise"
          title={$t('apprise')}
          subtitle={$t('admin.notification_apprise_setting_description')}
        >
          <div class="ms-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title={$t('admin.notification_enable_apprise_notifications')}
              {disabled}
              bind:checked={configToEdit.notifications.apprise.enabled}
            />

            <hr />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              required
              label={$t('url')}
              description={$t('admin.notification_apprise_url_description')}
              disabled={appriseDisabled}
              bind:value={configToEdit.notifications.apprise.url}
              isEdited={configToEdit.notifications.apprise.url !== config.notifications.apprise.url}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label={$t('admin.notification_apprise_config_id')}
              description={$t('admin.notification_apprise_config_id_description')}
              disabled={appriseDisabled}
              bind:value={configToEdit.notifications.apprise.configId}
              isEdited={configToEdit.notifications.apprise.configId !== config.notifications.apprise.configId}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label={$t('username')}
              description={$t('admin.notification_apprise_username_description')}
              disabled={appriseDisabled}
              bind:value={configToEdit.notifications.apprise.username}
              isEdited={configToEdit.notifications.apprise.username !== config.notifications.apprise.username}
            />

            <SettingInputField
              inputType={SettingInputFieldType.PASSWORD}
              label={$t('password')}
              description={$t('admin.notification_apprise_password_description')}
              disabled={appriseDisabled}
              bind:value={configToEdit.notifications.apprise.password}
              isEdited={configToEdit.notifications.apprise.password !== config.notifications.apprise.password}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              required
              min={1}
              max={300}
              label={$t('admin.notification_apprise_timeout')}
              description={$t('admin.notification_apprise_timeout_description')}
              disabled={appriseDisabled}
              bind:value={configToEdit.notifications.apprise.timeout}
              isEdited={configToEdit.notifications.apprise.timeout !== config.notifications.apprise.timeout}
            />

            <div class="flex place-items-center gap-2">
              <Button
                size="small"
                shape="round"
                loading={isSendingApprise}
                disabled={!configToEdit.notifications.apprise.enabled}
                onclick={handleSendTestApprise}
              >
                {#if disabled}
                  {$t('admin.notification_apprise_test')}
                {:else}
                  {$t('admin.notification_apprise_sent_test_button')}
                {/if}
              </Button>
            </div>
          </div>
        </SettingAccordion>
      </div>
    </form>
  </div>
  <TemplateSettings bind:config={configToEdit} />

  <SettingButtonsRow bind:configToEdit keys={['notifications', 'templates']} {disabled} />
</div>
