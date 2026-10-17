<script lang="ts">
  import { createPreloadedQuery } from '$lib/queries/client';
  import { getConfigQuery } from '$lib/queries/system-config.query';
  import { cloneDeep } from 'lodash-es';
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import SettingTextarea from './SettingTextarea.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const query = createPreloadedQuery(getConfigQuery);
  const config = $derived(query.data);

  const disabled = $derived(featureFlagsManager.value.configFile);
  let configToEdit = $state(cloneDeep(config));
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" onsubmit={(event) => event.preventDefault()}>
      <div class="ms-4 mt-4 flex flex-col gap-4">
        <SettingTextarea
          {disabled}
          label={$t('admin.theme_custom_css_settings')}
          description={$t('admin.theme_custom_css_settings_description')}
          bind:value={configToEdit.theme.customCss}
          isEdited={configToEdit.theme.customCss !== config.theme.customCss}
        />

        <SettingButtonsRow bind:configToEdit keys={['theme']} {disabled} />
      </div>
    </form>
  </div>
</div>
