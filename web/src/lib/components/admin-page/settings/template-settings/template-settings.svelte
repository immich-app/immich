<script lang="ts">
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingTextarea from '$lib/components/shared-components/settings/setting-textarea.svelte';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import EmailTemplatePreviewModal from '$lib/modals/EmailTemplatePreviewModal.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { type SystemConfigDto, type SystemConfigTemplateEmailsDto, getNotificationTemplateAdmin } from '@immich/sdk';
  import { Button, Icon, LoadingSpinner, modalManager } from '@immich/ui';
  import { mdiEyeOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  interface Props {
    savedConfig: SystemConfigDto;
    config: SystemConfigDto;
  }

  let { savedConfig, config = $bindable() }: Props = $props();

  let loadingPreview = $state(false);

  const getTemplate = async (name: string, template: string) => {
    try {
      loadingPreview = true;
      const { html } = await getNotificationTemplateAdmin({ name, templateDto: { template } });
      await modalManager.show(EmailTemplatePreviewModal, { html });
    } catch (error) {
      handleError(error, 'Could not load template.');
    } finally {
      loadingPreview = false;
    }
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

<div in:fade={{ duration: 500 }}>
  <form autocomplete="off" {onsubmit} class="mt-4">
    <div class="flex flex-col gap-4">
      <SettingAccordion
        key="templates"
        title={$t('admin.template_email_settings')}
        subtitle={$t('admin.template_settings_description')}
      >
        <div class="ms-4 mt-4 flex flex-col gap-4">
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
                <Icon icon={mdiEyeOutline} class="me-1" />
                {$t('admin.template_email_preview')}
              </Button>
            </div>
          {/each}
        </div>
      </SettingAccordion>
    </div>
  </form>
</div>
