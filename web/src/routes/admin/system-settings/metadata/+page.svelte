<script lang="ts">
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import SystemSettingsModal from '$lib/modals/SystemSettingsModal.svelte';
  import { t } from 'svelte-i18n';
</script>

<SystemSettingsModal keys={['metadata']}>
  {#snippet child({ disabled, configToEdit })}
    <SettingSwitch
      title={$t('admin.metadata_faces_import_setting')}
      subtitle={$t('admin.metadata_faces_import_setting_description')}
      bind:checked={configToEdit.metadata.faces.import}
      {disabled}
    />
  {/snippet}
</SystemSettingsModal>
