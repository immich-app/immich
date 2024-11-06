<script lang="ts">
  import { createBubbler, preventDefault } from 'svelte/legacy';

  const bubble = createBubbler();
  import { type SystemConfigDto, type SystemConfigTemplateEmailsDto, getNotificationTemplate } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import { t } from 'svelte-i18n';
  import FormatMessage from '$lib/components/i18n/format-message.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiEyeOutline } from '@mdi/js';
  import { handleError } from '$lib/utils/handle-error';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import SettingTextareaWysiwyg from '$lib/components/shared-components/settings/setting-textarea-wysiwyg.svelte';

  interface Props {
    savedConfig: SystemConfigDto;
    defaultConfig: SystemConfigDto;
    config: SystemConfigDto;
    disabled: boolean;
    onReset: SettingsResetEvent;
    onSave: SettingsSaveEvent;
  }

  let { savedConfig, defaultConfig, config, disabled = false, onReset, onSave }: Props = $props();

  let _htmlPreview = $state('');
  let loadingPreview = $state(false);

  const getTemplate = async (name: string, template: string) => {
    try {
      loadingPreview = true;
      const result = await getNotificationTemplate({ name, templateDto: { tempTemplate: template } });
      _htmlPreview = result.html;
    } catch (error) {
      handleError(error, 'Could not load template.');
    } finally {
      loadingPreview = false;
    }
  };

  const closePreviewModal = () => {
    _htmlPreview = '';
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
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" onsubmit={preventDefault(bubble('submit'))} class="mt-4">
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

            {#each templateConfigs as { label, templateKey, descriptionTags, templateName }}
              <SettingTextareaWysiwyg
                {label}
                desc={$t('admin.template_email_available_tags', { values: { tags: descriptionTags } })}
                bind:value={config.templates.email[templateKey]}
                isEdited={isEdited(templateKey)}
                disabled={!config.notifications.smtp.enabled}
              />
              <div class="flex justify-between">
                <Button
                  size="sm"
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

      {#if _htmlPreview}
        <FullScreenModal title={$t('admin.template_email_preview')} onClose={closePreviewModal} width="wide">
          <div style="position:relative; width:100%; height:90vh; overflow: hidden">
            <iframe
              title={$t('admin.template_email_preview')}
              srcdoc={_htmlPreview}
              style="width: 100%; height: 100%; border: none; overflow:hidden; position: absolute; top: 0; left: 0;"
            ></iframe>
          </div>
        </FullScreenModal>
      {/if}

      <SettingButtonsRow
        onReset={(options) => onReset({ ...options, configKeys: ['templates'] })}
        onSave={() => onSave({ templates: config.templates })}
        showResetToDefault={!isEqual(savedConfig, defaultConfig)}
        {disabled}
      />
    </form>
  </div>
</div>
