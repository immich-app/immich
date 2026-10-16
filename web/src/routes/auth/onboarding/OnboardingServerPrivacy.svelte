<script lang="ts">
  import SettingSwitch from '$lib/components/shared-components/settings/SettingSwitch.svelte';
  import { createPreloadedQuery, executeMutation } from '$lib/queries/client';
  import { getConfigQuery, updateConfigMutation } from '$lib/queries/system-config.query';
  import { cloneDeep } from 'lodash-es';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';

  const query = createPreloadedQuery(getConfigQuery);
  const configToEdit = $state(cloneDeep(query.data));

  onDestroy(() => {
    void executeMutation(updateConfigMutation(), {
      map: configToEdit.map,
      newVersionCheck: configToEdit.newVersionCheck,
    });
  });
</script>

<div class="flex flex-col gap-4">
  <p>
    {$t('onboarding_privacy_description')}
  </p>

  <SettingSwitch
    title={$t('admin.map_settings')}
    subtitle={$t('admin.map_implications')}
    bind:checked={configToEdit.map.enabled}
  />
  <SettingSwitch
    title={$t('admin.version_check_settings')}
    subtitle={$t('admin.version_check_implications', { values: { server: 'version.immich.cloud' } })}
    bind:checked={configToEdit.newVersionCheck.enabled}
  />
</div>
