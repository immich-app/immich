<script lang="ts">
  import SettingTextarea from '$lib/components/shared-components/settings/setting-textarea.svelte';
  import SystemSettingsModal from '$lib/modals/SystemSettingsModal.svelte';
  import { t } from 'svelte-i18n';
</script>

<SystemSettingsModal keys={['theme']}>
  {#snippet child({ disabled, config, configToEdit })}
    <SettingTextarea
      {disabled}
      label={$t('admin.theme_custom_css_settings')}
      description={$t('admin.theme_custom_css_settings_description')}
      bind:value={configToEdit.theme.customCss}
      isEdited={configToEdit.theme.customCss !== config.theme.customCss}
    />
  {/snippet}
</SystemSettingsModal>
