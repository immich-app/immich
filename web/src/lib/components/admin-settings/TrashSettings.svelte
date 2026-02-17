<script lang="ts">
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const disabled = $derived(featureFlagsManager.value.configFile);
  const config = $derived(systemConfigManager.value);
  let configToEdit = $state(systemConfigManager.cloneValue());
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" onsubmit={(event) => event.preventDefault()}>
      <div class="ms-4 mt-4 flex flex-col gap-4">
        <SettingSwitch
          title={$t('admin.trash_enabled_description')}
          {disabled}
          bind:checked={configToEdit.trash.enabled}
        />

        <hr />

        <SettingInputField
          inputType={SettingInputFieldType.NUMBER}
          label={$t('admin.trash_number_of_days')}
          description={$t('admin.trash_number_of_days_description')}
          bind:value={configToEdit.trash.days}
          required={true}
          disabled={disabled || !configToEdit.trash.enabled}
          isEdited={configToEdit.trash.days !== config.trash.days}
        />

        <SettingButtonsRow bind:configToEdit keys={['trash']} {disabled} />
      </div>
    </form>
  </div>
</div>
