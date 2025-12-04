<script lang="ts">
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import SystemSettingsModal from '$lib/modals/SystemSettingsModal.svelte';
  import { t } from 'svelte-i18n';
</script>

<SystemSettingsModal keys={['newVersionCheck']}>
  {#snippet child({ disabled, configToEdit })}
    <SettingSwitch
      title={$t('admin.version_check_enabled_description')}
      subtitle={$t('admin.version_check_implications')}
      bind:checked={configToEdit.newVersionCheck.enabled}
      {disabled}
    />
  {/snippet}
</SystemSettingsModal>
