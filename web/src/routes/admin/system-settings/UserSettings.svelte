<script lang="ts">
  import { createPreloadedQuery } from '$lib/queries/client';
  import { getConfigQuery } from '$lib/queries/system-config.query';
  import { cloneDeep } from 'lodash-es';
  import { fade } from 'svelte/transition';

  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/SettingInputField.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { t } from 'svelte-i18n';

  const query = createPreloadedQuery(getConfigQuery);
  const config = $derived(query.data);

  const disabled = $derived(featureFlagsManager.value.configFile);
  let configToEdit = $state(cloneDeep(config));
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" onsubmit={(e) => e.preventDefault()}>
      <div class="ms-4 mt-4 flex flex-col gap-4">
        <SettingInputField
          inputType={SettingInputFieldType.NUMBER}
          min={1}
          label={$t('admin.user_delete_delay_settings')}
          description={$t('admin.user_delete_delay_settings_description')}
          bind:value={configToEdit.user.deleteDelay}
          isEdited={configToEdit.user.deleteDelay !== config.user.deleteDelay}
        />
      </div>

      <div class="ms-4">
        <SettingButtonsRow bind:configToEdit keys={['user']} {disabled} />
      </div>
    </form>
  </div>
</div>
