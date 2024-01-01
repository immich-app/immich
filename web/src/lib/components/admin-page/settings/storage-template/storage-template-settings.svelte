<script lang="ts">
  import { api, SystemConfigStorageTemplateDto, SystemConfigTemplateStorageOptionDto } from '@api';
  import * as luxon from 'luxon';
  import handlebar from 'handlebars';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { fade } from 'svelte/transition';
  import SupportedDatetimePanel from './supported-datetime-panel.svelte';
  import SupportedVariablesPanel from './supported-variables-panel.svelte';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import { isEqual } from 'lodash-es';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
  import { user } from '$lib/stores/user.store';
  import type { ResetOptions } from '$lib/utils/dipatch';
  import SettingSwitch from '$lib/components/admin-page/settings/setting-switch.svelte';

  export let storageConfig: SystemConfigStorageTemplateDto;
  export let disabled = false;

  let savedConfig: SystemConfigStorageTemplateDto;
  let defaultConfig: SystemConfigStorageTemplateDto;
  let templateOptions: SystemConfigTemplateStorageOptionDto;
  let selectedPreset = '';

  const handleReset = (detail: ResetOptions) => {
    if (detail.default) {
      resetToDefault();
    } else {
      reset();
    }
  };

  async function getConfigs() {
    [savedConfig, defaultConfig, templateOptions] = await Promise.all([
      api.systemConfigApi.getConfig().then((res) => res.data.storageTemplate),
      api.systemConfigApi.getConfigDefaults().then((res) => res.data.storageTemplate),
      api.systemConfigApi.getStorageTemplateOptions().then((res) => res.data),
    ]);

    selectedPreset = savedConfig.template;
  }

  const getSupportDateTimeFormat = async () => {
    const { data } = await api.systemConfigApi.getStorageTemplateOptions();
    return data;
  };

  $: parsedTemplate = () => {
    try {
      return renderTemplate(storageConfig.template);
    } catch (error) {
      return 'error';
    }
  };

  const renderTemplate = (templateString: string) => {
    const template = handlebar.compile(templateString, {
      knownHelpers: undefined,
    });

    const substitutions: Record<string, string> = {
      filename: 'IMAGE_56437',
      ext: 'jpg',
      filetype: 'IMG',
      filetypefull: 'IMAGE',
      assetId: 'a8312960-e277-447d-b4ea-56717ccba856',
      album: 'Album Name',
    };

    const dt = luxon.DateTime.fromISO(new Date('2022-02-03T04:56:05.250').toISOString());

    const dateTokens = [
      ...templateOptions.yearOptions,
      ...templateOptions.monthOptions,
      ...templateOptions.weekOptions,
      ...templateOptions.dayOptions,
      ...templateOptions.hourOptions,
      ...templateOptions.minuteOptions,
      ...templateOptions.secondOptions,
    ];

    for (const token of dateTokens) {
      substitutions[token] = dt.toFormat(token);
    }

    return template(substitutions);
  };

  async function reset() {
    const { data: resetConfig } = await api.systemConfigApi.getConfig();

    storageConfig.template = resetConfig.storageTemplate.template;
    savedConfig.template = resetConfig.storageTemplate.template;

    notificationController.show({
      message: 'Reset storage template settings to the recent saved settings',
      type: NotificationType.Info,
    });
  }

  async function saveSetting() {
    try {
      const { data: currentConfig } = await api.systemConfigApi.getConfig();

      const result = await api.systemConfigApi.updateConfig({
        systemConfigDto: {
          ...currentConfig,
          storageTemplate: storageConfig,
        },
      });

      storageConfig.template = result.data.storageTemplate.template;
      savedConfig.template = result.data.storageTemplate.template;

      notificationController.show({
        message: 'Storage template saved',
        type: NotificationType.Info,
      });
    } catch (e) {
      console.error('Error [storage-template-settings] [saveSetting]', e);
      notificationController.show({
        message: 'Unable to save settings',
        type: NotificationType.Error,
      });
    }
  }

  async function resetToDefault() {
    const { data: defaultConfig } = await api.systemConfigApi.getConfigDefaults();

    storageConfig.template = defaultConfig.storageTemplate.template;

    notificationController.show({
      message: 'Reset storage template to default',
      type: NotificationType.Info,
    });
  }

  const handlePresetSelection = () => {
    storageConfig.template = selectedPreset;
  };
</script>

<section class="dark:text-immich-dark-fg">
  {#await getConfigs() then}
    <div id="directory-path-builder" class="flex flex-col gap-4 m-4">
      <SettingSwitch
        title="ENABLED"
        {disabled}
        subtitle="Enable storage template engine"
        bind:checked={storageConfig.enabled}
      />

      <SettingSwitch
        title="HASH VERIFICATION ENABLED"
        {disabled}
        subtitle="Enables hash verification, don't disable this unless you're certain of the implications"
        bind:checked={storageConfig.hashVerificationEnabled}
      />

      <hr />

      <h3 class="text-base font-medium text-immich-primary dark:text-immich-dark-primary">Variables</h3>

      <section class="support-date">
        {#await getSupportDateTimeFormat()}
          <LoadingSpinner />
        {:then options}
          <div transition:fade={{ duration: 200 }}>
            <SupportedDatetimePanel {options} />
          </div>
        {/await}
      </section>

      <section class="support-date">
        <SupportedVariablesPanel />
      </section>

      <div class="flex flex-col mt-4">
        <h3 class="text-base font-medium text-immich-primary dark:text-immich-dark-primary">Template</h3>

        <div class="my-2 text-sm">
          <h4>PREVIEW</h4>
        </div>

        <p class="text-sm">
          Approximately path length limit : <span
            class="font-semibold text-immich-primary dark:text-immich-dark-primary"
            >{parsedTemplate().length + $user.id.length + 'UPLOAD_LOCATION'.length}</span
          >/260
        </p>

        <p class="text-sm">
          <code class="text-immich-primary dark:text-immich-dark-primary">{$user.storageLabel || $user.id}</code> is the
          user's Storage Label
        </p>

        <p class="p-4 py-2 mt-2 text-xs bg-gray-200 rounded-lg dark:bg-gray-700 dark:text-immich-dark-fg">
          <span class="text-immich-fg/25 dark:text-immich-dark-fg/50"
            >UPLOAD_LOCATION/{$user.storageLabel || $user.id}</span
          >/{parsedTemplate()}.jpg
        </p>

        <form autocomplete="off" class="flex flex-col" on:submit|preventDefault>
          <div class="flex flex-col my-2">
            <label class="text-sm" for="preset-select">PRESET</label>
            <select
              class="immich-form-input p-2 mt-2 text-sm rounded-lg bg-slate-200 hover:cursor-pointer dark:bg-gray-600"
              disabled={disabled || !storageConfig.enabled}
              name="presets"
              id="preset-select"
              bind:value={selectedPreset}
              on:change={handlePresetSelection}
            >
              {#each templateOptions.presetOptions as preset}
                <option value={preset}>{renderTemplate(preset)}</option>
              {/each}
            </select>
          </div>
          <div class="flex gap-2 align-bottom">
            <SettingInputField
              label="TEMPLATE"
              disabled={disabled || !storageConfig.enabled}
              required
              inputType={SettingInputFieldType.TEXT}
              bind:value={storageConfig.template}
              isEdited={!(storageConfig.template === savedConfig.template)}
            />

            <div class="flex-0">
              <SettingInputField label="EXTENSION" inputType={SettingInputFieldType.TEXT} value={'.jpg'} disabled />
            </div>
          </div>

          <div id="migration-info" class="mt-2 text-sm">
            <h3 class="text-base font-medium text-immich-primary dark:text-immich-dark-primary">Notes</h3>
            <section class="flex flex-col gap-2">
              <p>
                Template changes will only apply to new assets. To retroactively apply the template to previously
                uploaded assets, run the
                <a href="/admin/jobs-status" class="text-immich-primary dark:text-immich-dark-primary"
                  >Storage Migration Job</a
                >.
              </p>
              <p>
                The template variable <span class="font-mono">{`{{album}}`}</span> will always be empty for new assets,
                so manually running the

                <a href="/admin/jobs-status" class="text-immich-primary dark:text-immich-dark-primary"
                  >Storage Migration Job</a
                >
                is required in order to successfully use the variable.
              </p>
            </section>
          </div>
          <SettingButtonsRow
            on:reset={({ detail }) => handleReset(detail)}
            on:save={saveSetting}
            showResetToDefault={!isEqual(savedConfig, defaultConfig)}
            {disabled}
          />
        </form>
      </div>
    </div>
  {/await}
</section>
