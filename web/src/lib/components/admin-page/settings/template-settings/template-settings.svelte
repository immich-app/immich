<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import FormatMessage from '$lib/components/i18n/format-message.svelte';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingTextarea from '$lib/components/shared-components/settings/setting-textarea.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { type SystemConfigDto, type SystemConfigTemplateEmailsDto, getNotificationTemplate } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import { mdiEyeOutline } from '@mdi/js';
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

  let { savedConfig, config = $bindable() }: Props = $props();

  let htmlPreview = $state('');
  let loadingPreview = $state(false);

  const getTemplate = async (name: string, template: string) => {
    try {
      loadingPreview = true;
      const result = await getNotificationTemplate({ name, templateDto: { template } });
      htmlPreview = result.html;
    } catch (error) {
      handleError(error, 'Could not load template.');
    } finally {
      loadingPreview = false;
    }
  };

  const closePreviewModal = () => {
    htmlPreview = '';
  };

  const templateConfigs = [
    {
      label: $t('admin.template_email_welcome'),
      templateKey: 'welcomeTemplate' as const,
      descriptionTags: '{username}, {password}, {displayName}, {baseUrl}',
      templateName: 'welcome',
    },
    {
      label: $t('admin.template_email_invite_album'),
      templateKey: 'albumInviteTemplate' as const,
      descriptionTags: '{senderName}, {recipientName}, {albumId}, {albumName}, {baseUrl}',
      templateName: 'album-invite',
    },
    {
      label: $t('admin.template_email_update_album'),
      templateKey: 'albumUpdateTemplate' as const,
      descriptionTags: '{recipientName}, {albumId}, {albumName}, {baseUrl}',
      templateName: 'album-update',
    },
  ];

  const isEdited = (templateKey: keyof SystemConfigTemplateEmailsDto) =>
    config.templates.email[templateKey] !== savedConfig.templates.email[templateKey];

  const onsubmit = (event: Event) => {
    event.preventDefault();
  };
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" {onsubmit} class="mt-4">
      <div class="flex flex-col gap-4">
        <SettingAccordion
          key="templates"
          title={$t('admin.template_email_settings')}
          subtitle={$t('admin.template_settings_description')}
        >
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <p class="text-sm dark:text-immich-dark-fg">
              <FormatMessage key="admin.template_email_if_empty">
                {$t('admin.template_email_if_empty')}
              </FormatMessage>
            </p>
            <hr />
            {#if loadingPreview}
              <LoadingSpinner />
            {/if}

            {#each templateConfigs as { label, templateKey, descriptionTags, templateName } (templateKey)}
              <SettingTextarea
                {label}
                description={$t('admin.template_email_available_tags', { values: { tags: descriptionTags } })}
                bind:value={config.templates.email[templateKey]}
                isEdited={isEdited(templateKey)}
                disabled={!config.notifications.smtp.enabled}
              />
              <div class="flex justify-between">
                <Button
                  size="small"
                  shape="round"
                  onclick={() => getTemplate(templateName, config.templates.email[templateKey])}
                  title={$t('admin.template_email_preview')}
                >
                  <Icon path={mdiEyeOutline} class="mr-1" />
                  {$t('admin.template_email_preview')}
                </Button>
              </div>
            {/each}
          </div>
        </SettingAccordion>
      </div>

      {#if htmlPreview}
        <FullScreenModal title={$t('admin.template_email_preview')} onClose={closePreviewModal} width="wide">
          <div style="position:relative; width:100%; height:90vh; overflow: hidden">
            <iframe
              title={$t('admin.template_email_preview')}
              srcdoc={htmlPreview}
              style="width: 100%; height: 100%; border: none; overflow:hidden; position: absolute; top: 0; left: 0;"
            ></iframe>
          </div>
        </FullScreenModal>
      {/if}
    </form>
  </div>
</div>
