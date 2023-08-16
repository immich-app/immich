<script lang="ts">
  import type { SystemConfigStorageTemplateDto, SystemConfigTemplateStorageOptionDto, UserResponseDto } from '@api';
  import * as luxon from 'luxon';
  import handlebar from 'handlebars';
  import SupportedVariablesPanel from './supported-variables-panel.svelte';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import { isEqual } from 'lodash-es';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    save: SystemConfigStorageTemplateDto;
  }>();

  export let storageConfig: SystemConfigStorageTemplateDto;
  export let storageDefault: SystemConfigStorageTemplateDto;
  export let user: UserResponseDto;
  export let templateOptions: SystemConfigTemplateStorageOptionDto;

  export let savedConfig: SystemConfigStorageTemplateDto;
  let selectedPreset = '';

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
    };

    const dt = luxon.DateTime.fromISO(new Date('2022-09-04T20:03:05.250').toISOString());

    const dateTokens = [
      ...templateOptions.yearOptions,
      ...templateOptions.monthOptions,
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
    storageConfig = { ...savedConfig };
    notificationController.show({
      message: 'Reset storage template settings to the last saved settings',
      type: NotificationType.Info,
    });
  }

  async function resetToDefault() {
    storageConfig = { ...storageDefault };

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
  <div id="directory-path-builder" class="m-4">
    <h3 class="text-base font-medium text-immich-primary dark:text-immich-dark-primary">Variables</h3>

    <section class="support-date" />

    <section class="support-date">
      <SupportedVariablesPanel />
    </section>

    <div class="mt-4 flex flex-col">
      <h3 class="text-base font-medium text-immich-primary dark:text-immich-dark-primary">Template</h3>

      <div class="my-2 text-xs">
        <h4>PREVIEW</h4>
      </div>

      <p class="text-xs">
        Approximately path length limit : <span class="font-semibold text-immich-primary dark:text-immich-dark-primary"
          >{parsedTemplate().length + user.id.length + 'UPLOAD_LOCATION'.length}</span
        >/260
      </p>

      <p class="text-xs">
        <code>{user.storageLabel || user.id}</code> is the user's Storage Label
      </p>

      <p class="mt-2 rounded-lg bg-gray-200 p-4 py-2 text-xs dark:bg-gray-700 dark:text-immich-dark-fg">
        <span class="text-immich-fg/25 dark:text-immich-dark-fg/50">UPLOAD_LOCATION/{user.storageLabel || user.id}</span
        >/{parsedTemplate()}.jpg
      </p>

      <form autocomplete="off" class="flex flex-col" on:submit|preventDefault>
        <div class="my-2 flex flex-col">
          <label class="text-xs" for="preset-select">PRESET</label>
          <select
            class="mt-2 rounded-lg bg-slate-200 p-2 text-sm hover:cursor-pointer dark:bg-gray-600"
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
            required
            inputType={SettingInputFieldType.TEXT}
            bind:value={storageConfig.template}
            isEdited={!(storageConfig.template === savedConfig.template)}
          />

          <div class="flex-0">
            <SettingInputField label="EXTENSION" inputType={SettingInputFieldType.TEXT} value={'.jpg'} disabled />
          </div>
        </div>

        <div id="migration-info" class="mt-4 text-sm">
          <p>
            Template changes will only apply to new assets. To retroactively apply the template to previously uploaded
            assets, run the <a href="/admin/jobs-status" class="text-immich-primary dark:text-immich-dark-primary"
              >Storage Migration Job</a
            >
          </p>
        </div>

        <SettingButtonsRow
          on:reset={reset}
          on:save={() => dispatch('save', savedConfig)}
          on:reset-to-default={resetToDefault}
          showResetToDefault={!isEqual(savedConfig, storageConfig)}
        />
      </form>
    </div>
  </div>
</section>
