<script lang="ts">
  import { type SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import { t } from 'svelte-i18n';
  import SettingTextarea from '$lib/components/shared-components/settings/setting-textarea.svelte';

  export let savedConfig: SystemConfigDto;
  export let defaultConfig: SystemConfigDto;
  export let config: SystemConfigDto; // this is the config that is being edited
  export let disabled = false;
  export let onReset: SettingsResetEvent;
  export let onSave: SettingsSaveEvent;
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault class="mt-4">
      <div class="flex flex-col gap-4">
        <SettingAccordion
          key="templates"
          title={$t('admin.template_email_settings')}
          subtitle={$t('admin.template_settings_description')}
        >
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingTextarea
              label={$t('admin.template_email_welcome')}
              desc={$t('admin.template_email_available_tags', {
                values: { tags: '{username}, {password}, {displayName}, {baseUrl}' },
              })}
              bind:value={config.templates.email.welcomeTemplate}
              isEdited={config.templates.email.welcomeTemplate !== savedConfig.templates.email.welcomeTemplate}
            />
          </div>
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingTextarea
              label={$t('admin.template_email_invite_album')}
              desc={$t('admin.template_email_available_tags', {
                values: { tags: '{senderName}, {recipientName}, {albumId}, {albumName}, {baseUrl}' },
              })}
              bind:value={config.templates.email.albumInviteTemplate}
              isEdited={config.templates.email.albumInviteTemplate !== savedConfig.templates.email.albumInviteTemplate}
            />
          </div>
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingTextarea
              label={$t('admin.template_email_update_album')}
              desc={$t('admin.template_email_available_tags', {
                values: { tags: '{recipientName}, {albumId}, {albumName}, {baseUrl}' },
              })}
              bind:value={config.templates.email.albumUpdateTemplate}
              isEdited={config.templates.email.albumUpdateTemplate !== savedConfig.templates.email.albumUpdateTemplate}
            />
          </div>
        </SettingAccordion>
      </div>

      <SettingButtonsRow
        onReset={(options) => onReset({ ...options, configKeys: ['templates'] })}
        onSave={() => onSave({ templates: config.templates })}
        showResetToDefault={!isEqual(savedConfig, defaultConfig)}
        {disabled}
      />
    </form>
  </div>
</div>
