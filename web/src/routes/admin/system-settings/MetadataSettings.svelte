<script lang="ts">
  import { createPreloadedQuery } from '$lib/queries/client';
  import { getAdminConfigQuery } from '$lib/queries/config-admin.query';
  import { cloneDeep } from 'lodash-es';
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/SettingSwitch.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const query = createPreloadedQuery(getAdminConfigQuery);

  const disabled = $derived(featureFlagsManager.value.configFile);
  let configToEdit = $state(cloneDeep(query.data));
</script>

<div class="mt-2">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" class="mx-4 mt-4" onsubmit={(event) => event.preventDefault()}>
      <div class="ms-4 mt-4 flex flex-col gap-4">
        <SettingSwitch
          title={$t('admin.metadata_faces_import_setting')}
          subtitle={$t('admin.metadata_faces_import_setting_description')}
          bind:checked={configToEdit.metadata.faces.import}
          {disabled}
        />
      </div>

      <SettingButtonsRow bind:configToEdit keys={['metadata']} {disabled} />
    </form>
  </div>
</div>
