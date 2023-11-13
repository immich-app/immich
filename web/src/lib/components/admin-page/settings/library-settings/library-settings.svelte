<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { api, SystemConfigLibraryDto } from '@api';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
  import SettingSwitch from '../setting-switch.svelte';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import { handleError } from '../../../../utils/handle-error';
  import SettingAccordion from '../setting-accordion.svelte';

  export let libraryConfig: SystemConfigLibraryDto; // this is the config that is being edited
  export let disabled = false;

  const cronExpressionOptions = [
    { title: 'Every night at midnight', expression: '0 0 * * *' },
    { title: 'Every night at 2am', expression: '0 2 * * *' },
    { title: 'Every day at 1pm', expression: '0 13 * * *' },
    { title: 'Every 6 hours', expression: '0 */6 * * *' },
  ];

  let savedConfig: SystemConfigLibraryDto;
  let defaultConfig: SystemConfigLibraryDto;

  async function getConfigs() {
    [savedConfig, defaultConfig] = await Promise.all([
      api.systemConfigApi.getConfig().then((res) => res.data.library),
      api.systemConfigApi.getConfigDefaults().then((res) => res.data.library),
    ]);
  }

  async function saveSetting() {
    try {
      const { data: configs } = await api.systemConfigApi.getConfig();

      const result = await api.systemConfigApi.updateConfig({
        systemConfigDto: {
          ...configs,
          library: libraryConfig,
        },
      });

      libraryConfig = { ...result.data.library };
      savedConfig = { ...result.data.library };

      notificationController.show({
        message: 'Library settings saved',
        type: NotificationType.Info,
      });
    } catch (e) {
      handleError(e, 'Unable to save settings');
    }
  }

  async function reset() {
    const { data: resetConfig } = await api.systemConfigApi.getConfig();

    libraryConfig = { ...resetConfig.library };
    savedConfig = { ...resetConfig.library };

    notificationController.show({
      message: 'Reset library settings to the recent saved settings',
      type: NotificationType.Info,
    });
  }

  async function resetToDefault() {
    const { data: configs } = await api.systemConfigApi.getConfigDefaults();

    libraryConfig = { ...configs.library };
    defaultConfig = { ...configs.library };

    notificationController.show({
      message: 'Reset library settings to default',
      type: NotificationType.Info,
    });
  }
</script>

<div>
  {#await getConfigs() then}
    <div in:fade={{ duration: 500 }}>
      <SettingAccordion title="Scanning" subtitle="Settings for library scanning" isOpen>
        <form autocomplete="off" on:submit|preventDefault>
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title="ENABLED"
              {disabled}
              subtitle="Enable automatic library scanning"
              bind:checked={libraryConfig.scan.enabled}
            />

            <div class="flex flex-col my-2 dark:text-immich-dark-fg">
              <label class="text-sm" for="expression-select">Cron Expression Presets</label>
              <select
                class="p-2 mt-2 text-sm rounded-lg bg-slate-200 hover:cursor-pointer dark:bg-gray-600"
                disabled={disabled || !libraryConfig.scan.enabled}
                name="expression"
                id="expression-select"
                bind:value={libraryConfig.scan.cronExpression}
              >
                {#each cronExpressionOptions as { title, expression }}
                  <option value={expression}>{title}</option>
                {/each}
              </select>
            </div>

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              required={true}
              disabled={disabled || !libraryConfig.scan.enabled}
              label="Cron Expression"
              bind:value={libraryConfig.scan.cronExpression}
              isEdited={libraryConfig.scan.cronExpression !== savedConfig.scan.cronExpression}
            >
              <svelte:fragment slot="desc">
                <p class="text-sm dark:text-immich-dark-fg">
                  Set the scanning interval using the cron format. For more information please refer to e.g. <a
                    href="https://crontab.guru"
                    class="underline"
                    target="_blank"
                    rel="noreferrer">Crontab Guru</a
                  >
                </p>
              </svelte:fragment>
            </SettingInputField>
          </div>

          <div class="ml-4">
            <SettingButtonsRow
              on:reset={reset}
              on:save={saveSetting}
              on:reset-to-default={resetToDefault}
              showResetToDefault={!isEqual(savedConfig, defaultConfig)}
              {disabled}
            />
          </div>
        </form>
      </SettingAccordion>
    </div>
  {/await}
</div>
