<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { api, SystemConfigStylesheetsDto } from '@api';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingTextarea from '../setting-textarea.svelte';

  export let stylesheetsConfig: SystemConfigStylesheetsDto; // this is the config that is being edited
  export let disabled = false;

  let savedConfig: SystemConfigStylesheetsDto;
  let defaultConfig: SystemConfigStylesheetsDto;

  async function getConfigs() {
    [savedConfig, defaultConfig] = await Promise.all([
      api.systemConfigApi.getConfig().then((res) => res.data.stylesheets),
      api.systemConfigApi.getDefaults().then((res) => res.data.stylesheets),
    ]);
  }

  async function saveSetting() {
    try {
      const { data: current } = await api.systemConfigApi.getConfig();

      const { data: updated } = await api.systemConfigApi.updateConfig({
        systemConfigDto: {
          ...current,
          stylesheets: stylesheetsConfig,
        },
      });

      stylesheetsConfig = { ...updated.stylesheets };
      savedConfig = { ...updated.stylesheets };

      notificationController.show({ message: 'Stylesheets saved', type: NotificationType.Info });
    } catch (error) {
      handleError(error, 'Unable to save settings');
    }
  }

  async function reset() {
    const { data: resetConfig } = await api.systemConfigApi.getConfig();

    stylesheetsConfig = { ...resetConfig.stylesheets };
    savedConfig = { ...resetConfig.stylesheets };

    notificationController.show({
      message: 'Reset stylesheets to the recent saved stylesheets',
      type: NotificationType.Info,
    });
  }

  async function resetToDefault() {
    const { data: configs } = await api.systemConfigApi.getDefaults();

    stylesheetsConfig = { ...configs.stylesheets };
    defaultConfig = { ...configs.stylesheets };

    notificationController.show({
      message: 'Reset stylesheets to default',
      type: NotificationType.Info,
    });
  }
</script>

<div>
  {#await getConfigs() then}
    <div in:fade={{ duration: 500 }}>
      <form autocomplete="off" on:submit|preventDefault>
        <div class="ml-4 mt-4 flex flex-col gap-4">
          <div class="ml-4">
            <SettingTextarea
              {disabled}
              label="Custom CSS"
              desc="Cascading Style Sheets allow the design of Immich to be customized."
              bind:value={stylesheetsConfig.css}
              required={true}
              isEdited={stylesheetsConfig.css !== savedConfig.css}
            />

            <SettingButtonsRow
              on:reset={reset}
              on:save={saveSetting}
              on:reset-to-default={resetToDefault}
              showResetToDefault={!isEqual(savedConfig, defaultConfig)}
              {disabled}
            />
          </div>
        </div>
      </form>
    </div>
  {/await}
</div>
