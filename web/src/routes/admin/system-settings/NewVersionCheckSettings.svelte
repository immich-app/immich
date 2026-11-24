<script lang="ts">
  import SettingSwitch from '#lib/components/shared-components/settings/SettingSwitch.svelte';
  import SettingButtonsRow from '#lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import { createPreloadedQuery } from '#lib/queries/client.ts';
  import { getAdminConfigQuery } from '#lib/queries/config-admin.query.ts';
  import { ReleaseChannel } from '@immich/sdk';
  import { cloneDeep } from 'lodash-es';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import SettingSelect from './SettingSelect.svelte';

  const query = createPreloadedQuery(getAdminConfigQuery);
  const config = $derived(query.data);

  let configToEdit = $state(cloneDeep(config));
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" onsubmit={(event) => event.preventDefault()}>
      <div class="ms-4 mt-4 flex flex-col gap-4">
        <SettingSwitch
          title={$t('admin.version_check_enabled_description')}
          subtitle={$t('admin.version_check_implications', { values: { server: 'version.immich.cloud' } })}
          key="newVersionCheck.enabled"
          bind:checked={configToEdit.newVersionCheck.enabled}
        />
        <SettingSelect
          label={$t('admin.version_check_channel')}
          desc={$t('admin.version_check_channel_description')}
          key="newVersionCheck.channel"
          bind:value={configToEdit.newVersionCheck.channel}
          options={[
            {
              value: ReleaseChannel.Stable,
              text: $t('admin.release_channel_stable'),
            },
            { value: ReleaseChannel.ReleaseCandidate, text: $t('admin.release_channel_release_candidate') },
          ]}
          isEdited={configToEdit.newVersionCheck.channel !== config.newVersionCheck.channel}
        />
        <SettingButtonsRow bind:configToEdit keys={['newVersionCheck']} />
      </div>
    </form>
  </div>
</div>
