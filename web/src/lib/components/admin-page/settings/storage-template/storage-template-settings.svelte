<script lang="ts">
  import { createBubbler, preventDefault } from 'svelte/legacy';

  const bubble = createBubbler();
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { AppRoute, SettingInputFieldType } from '$lib/constants';
  import { user } from '$lib/stores/user.store';
  import {
    getStorageTemplateOptions,
    type SystemConfigDto,
    type SystemConfigTemplateStorageOptionDto,
  } from '@immich/sdk';
  import handlebar from 'handlebars';
  import { isEqual } from 'lodash-es';
  import * as luxon from 'luxon';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';
  import SupportedDatetimePanel from './supported-datetime-panel.svelte';
  import SupportedVariablesPanel from './supported-variables-panel.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { t } from 'svelte-i18n';
  import FormatMessage from '$lib/components/i18n/format-message.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    savedConfig: SystemConfigDto;
    defaultConfig: SystemConfigDto;
    config: SystemConfigDto;
    disabled?: boolean;
    minified?: boolean;
    onReset: SettingsResetEvent;
    onSave: SettingsSaveEvent;
    duration?: number;
    children?: Snippet;
  }

  let {
    savedConfig,
    defaultConfig,
    config = $bindable(),
    disabled = false,
    minified = false,
    onReset,
    onSave,
    duration = 500,
    children,
  }: Props = $props();

  let templateOptions: SystemConfigTemplateStorageOptionDto | undefined = $state();
  let selectedPreset = $state('');

  const getTemplateOptions = async () => {
    templateOptions = await getStorageTemplateOptions();
    selectedPreset = savedConfig.storageTemplate.template;
  };

  const getSupportDateTimeFormat = () => getStorageTemplateOptions();

  const renderTemplate = (templateString: string) => {
    if (!templateOptions) {
      return '';
    }

    const template = handlebar.compile(templateString, {
      knownHelpers: undefined,
    });

    const substitutions: Record<string, string> = {
      filename: 'IMAGE_56437',
      ext: 'jpg',
      filetype: 'IMG',
      filetypefull: 'IMAGE',
      assetId: 'a8312960-e277-447d-b4ea-56717ccba856',
      assetIdShort: '56717ccba856',
      album: $t('album_name'),
    };

    const dt = luxon.DateTime.fromISO(new Date('2022-02-03T04:56:05.250').toISOString());
    const albumStartTime = luxon.DateTime.fromISO(new Date('2021-12-31T05:32:41.750').toISOString());
    const albumEndTime = luxon.DateTime.fromISO(new Date('2023-05-06T09:15:17.100').toISOString());

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
      substitutions['album-startDate-' + token] = albumStartTime.toFormat(token);
      substitutions['album-endDate-' + token] = albumEndTime.toFormat(token);
    }

    return template(substitutions);
  };

  const handlePresetSelection = () => {
    config.storageTemplate.template = selectedPreset;
  };
  let parsedTemplate = $derived(() => {
    try {
      return renderTemplate(config.storageTemplate.template);
    } catch {
      return 'error';
    }
  });
</script>

<section class="dark:text-immich-dark-fg mt-2">
  <div in:fade={{ duration }} class="mx-4 flex flex-col gap-4 py-4">
    <p class="text-sm dark:text-immich-dark-fg">
      <FormatMessage key="admin.storage_template_more_details">
        {#snippet children({ tag, message })}
          {#if tag === 'template-link'}
            <a
              href="https://immich.app/docs/administration/storage-template"
              class="underline"
              target="_blank"
              rel="noreferrer"
            >
              {message}
            </a>
          {:else if tag === 'implications-link'}
            <a
              href="https://immich.app/docs/administration/backup-and-restore#asset-types-and-storage-locations"
              class="underline"
              target="_blank"
              rel="noreferrer"
            >
              {message}
            </a>
          {/if}
        {/snippet}
      </FormatMessage>
    </p>
  </div>
  {#await getTemplateOptions() then}
    <div id="directory-path-builder" class="flex flex-col gap-4 {minified ? '' : 'ms-4 mt-4'}">
      <SettingSwitch
        title={$t('admin.storage_template_enable_description')}
        {disabled}
        bind:checked={config.storageTemplate.enabled}
        isEdited={!(config.storageTemplate.enabled === savedConfig.storageTemplate.enabled)}
      />

      {#if !minified}
        <SettingSwitch
          title={$t('admin.storage_template_hash_verification_enabled')}
          {disabled}
          subtitle={$t('admin.storage_template_hash_verification_enabled_description')}
          bind:checked={config.storageTemplate.hashVerificationEnabled}
          isEdited={!(
            config.storageTemplate.hashVerificationEnabled === savedConfig.storageTemplate.hashVerificationEnabled
          )}
        />
      {/if}

      {#if config.storageTemplate.enabled}
        <hr />

        <h3 class="text-base font-medium text-immich-primary dark:text-immich-dark-primary">{$t('variables')}</h3>

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
          <h3 class="text-base font-medium text-immich-primary dark:text-immich-dark-primary">{$t('template')}</h3>

          <div class="my-2 text-sm">
            <h4>{$t('preview').toUpperCase()}</h4>
          </div>

          <p class="text-sm">
            <FormatMessage
              key="admin.storage_template_path_length"
              values={{ length: parsedTemplate().length + $user.id.length + 'UPLOAD_LOCATION'.length, limit: 260 }}
            >
              {#snippet children({ message })}
                <span class="font-semibold text-immich-primary dark:text-immich-dark-primary">{message}</span>
              {/snippet}
            </FormatMessage>
          </p>

          <p class="text-sm">
            <FormatMessage key="admin.storage_template_user_label" values={{ label: $user.storageLabel || $user.id }}>
              {#snippet children({ message })}
                <code class="text-immich-primary dark:text-immich-dark-primary">{message}</code>
              {/snippet}
            </FormatMessage>
          </p>

          <p class="p-4 py-2 mt-2 text-xs bg-gray-200 rounded-lg dark:bg-gray-700 dark:text-immich-dark-fg">
            <span class="text-immich-fg/25 dark:text-immich-dark-fg/50"
              >UPLOAD_LOCATION/library/{$user.storageLabel || $user.id}</span
            >/{parsedTemplate()}.jpg
          </p>

          <form autocomplete="off" class="flex flex-col" onsubmit={preventDefault(bubble('submit'))}>
            <div class="flex flex-col my-2">
              {#if templateOptions}
                <label
                  class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm"
                  for="preset-select"
                >
                  {$t('preset')}
                </label>
                <select
                  class="immich-form-input p-2 mt-2 text-sm rounded-lg bg-slate-200 hover:cursor-pointer dark:bg-gray-600"
                  disabled={disabled || !config.storageTemplate.enabled}
                  name="presets"
                  id="preset-select"
                  bind:value={selectedPreset}
                  onchange={handlePresetSelection}
                >
                  {#each templateOptions.presetOptions as preset (preset)}
                    <option value={preset}>{renderTemplate(preset)}</option>
                  {/each}
                </select>
              {/if}
            </div>

            <div class="flex gap-2 align-bottom">
              <SettingInputField
                label={$t('template')}
                disabled={disabled || !config.storageTemplate.enabled}
                required
                inputType={SettingInputFieldType.TEXT}
                bind:value={config.storageTemplate.template}
                isEdited={!(config.storageTemplate.template === savedConfig.storageTemplate.template)}
              />

              <div class="flex-0">
                <SettingInputField
                  label={$t('extension')}
                  inputType={SettingInputFieldType.TEXT}
                  value=".jpg"
                  disabled
                />
              </div>
            </div>

            {#if !minified}
              <div id="migration-info" class="mt-2 text-sm">
                <h3 class="text-base font-medium text-immich-primary dark:text-immich-dark-primary">{$t('notes')}</h3>
                <section class="flex flex-col gap-2">
                  <p>
                    <FormatMessage
                      key="admin.storage_template_migration_info"
                      values={{ job: $t('admin.storage_template_migration_job') }}
                    >
                      {#snippet children({ message })}
                        <a href={AppRoute.ADMIN_JOBS} class="text-immich-primary dark:text-immich-dark-primary">
                          {message}
                        </a>
                      {/snippet}
                    </FormatMessage>
                  </p>
                </section>
              </div>
            {/if}
          </form>
        </div>
      {/if}

      {#if minified}
        {@render children?.()}
      {:else}
        <SettingButtonsRow
          onReset={(options) => onReset({ ...options, configKeys: ['storageTemplate'] })}
          onSave={() => onSave({ storageTemplate: config.storageTemplate })}
          showResetToDefault={!isEqual(savedConfig.storageTemplate, defaultConfig.storageTemplate) && !minified}
          {disabled}
        />
      {/if}
    </div>
  {/await}
</section>
