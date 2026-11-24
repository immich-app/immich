<script lang="ts">
  import SettingButtonsRow from '#lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import { createPreloadedQuery } from '#lib/queries/client.ts';
  import { getAdminConfigQuery } from '#lib/queries/config-admin.query.ts';
  import { cloneDeep } from 'lodash-es';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import SettingTextarea from './SettingTextarea.svelte';

  const query = createPreloadedQuery(getAdminConfigQuery);
  const config = $derived(query.data);

  let configToEdit = $state(cloneDeep(config));
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" onsubmit={(event) => event.preventDefault()}>
      <div class="ms-4 mt-4 flex flex-col gap-4">
        <SettingTextarea
          label={$t('admin.theme_custom_css_settings')}
          description={$t('admin.theme_custom_css_settings_description')}
          key="theme.customCss"
          bind:value={configToEdit.theme.customCss}
          isEdited={configToEdit.theme.customCss !== config.theme.customCss}
        />

        <SettingButtonsRow bind:configToEdit keys={['theme']} />
      </div>
    </form>
  </div>
</div>
