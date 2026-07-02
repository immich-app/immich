<script lang="ts">
  import SupportedDatetimePanel from '$lib/components/admin-settings/SupportedDatetimePanel.svelte';
  import SupportedVariablesPanel from '$lib/components/admin-settings/SupportedVariablesPanel.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/SettingInputField.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/SettingSwitch.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { Route } from '$lib/route';
  import { handleSystemConfigSave } from '$lib/services/system-config.service';
  import {
    getStorageTemplateOptions,
    renderStorageTemplate,
    type SystemConfigTemplateStorageOptionDto,
  } from '@immich/sdk';
  import { Heading, Link, LoadingSpinner, Text } from '@immich/ui';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';
  import { createBubbler, preventDefault } from 'svelte/legacy';
  import { fade } from 'svelte/transition';

  type Props = {
    minified?: boolean;
    duration?: number;
    saveOnClose?: boolean;
  };

  const { minified = false, duration = 500, saveOnClose = false }: Props = $props();

  const disabled = $derived(featureFlagsManager.value.configFile);
  const config = $derived(systemConfigManager.value);
  let configToEdit = $state(systemConfigManager.cloneValue());

  const bubble = createBubbler();
  let templateOptions: SystemConfigTemplateStorageOptionDto | undefined = $state();
  let selectedPreset = $state('');
  let renderedPreview = $state('');
  let renderTimeout: ReturnType<typeof setTimeout> | undefined;

  const getTemplateOptions = async () => {
    templateOptions = await getStorageTemplateOptions();
    selectedPreset = config.storageTemplate.template;
  };

  const getSupportDateTimeFormat = () => getStorageTemplateOptions();

  const handlePresetSelection = () => {
    configToEdit.storageTemplate.template = selectedPreset;
  };

  $effect(() => {
    selectedPreset = templateOptions?.presetOptions?.includes(configToEdit.storageTemplate.template)
      ? configToEdit.storageTemplate.template
      : '';
  });

  $effect(() => {
    clearTimeout(renderTimeout);
    const template = configToEdit.storageTemplate.template;
    if (!template) {
      renderedPreview = '';
      return;
    }
    renderTimeout = setTimeout(async () => {
      try {
        const { rendered } = await renderStorageTemplate({ renderStorageTemplateDto: { template } });
        renderedPreview = rendered;
      } catch {
        renderedPreview = 'error';
      }
    }, 300);
  });

  onDestroy(async () => {
    clearTimeout(renderTimeout);
    if (saveOnClose) {
      await handleSystemConfigSave({ storageTemplate: configToEdit.storageTemplate });
    }
  });
</script>

<section class="mt-2 dark:text-immich-dark-fg">
  <div in:fade={{ duration }} class="mx-4 flex flex-col gap-4 py-4">
    <p class="text-sm dark:text-immich-dark-fg">
      <FormatMessage key="admin.storage_template_more_details">
        {#snippet children({ tag, message })}
          {#if tag === 'template-link'}
            <Link href="https://docs.immich.app/administration/storage-template">{message}</Link>
          {:else if tag === 'implications-link'}
            <Link href="https://docs.immich.app/administration/backup-and-restore#asset-types-and-storage-locations">
              {message}
            </Link>
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
        bind:checked={configToEdit.storageTemplate.enabled}
        isEdited={!(configToEdit.storageTemplate.enabled === config.storageTemplate.enabled)}
      />

      {#if !minified}
        <SettingSwitch
          title={$t('admin.storage_template_hash_verification_enabled')}
          {disabled}
          subtitle={$t('admin.storage_template_hash_verification_enabled_description')}
          bind:checked={configToEdit.storageTemplate.hashVerificationEnabled}
          isEdited={!(
            configToEdit.storageTemplate.hashVerificationEnabled === config.storageTemplate.hashVerificationEnabled
          )}
        />
      {/if}

      {#if configToEdit.storageTemplate.enabled}
        <hr />

        <Heading size="tiny" color="primary">
          {$t('variables')}
        </Heading>

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

        <div class="mt-2 flex flex-col">
          <!-- <h3 class="text-base font-medium text-primary">{$t('template')}</h3> -->
          <Heading size="tiny" color="primary">
            {$t('template')}
          </Heading>

          <div class="my-2">
            <Text size="small">{$t('preview')}</Text>
          </div>

          <p class="text-sm">
            <FormatMessage
              key="admin.storage_template_path_length"
              values={{
                length: renderedPreview.length + authManager.user.id.length + 'UPLOAD_LOCATION'.length,
                limit: 260,
              }}
            >
              {#snippet children({ message })}
                <span class="font-semibold text-primary">{message}</span>
              {/snippet}
            </FormatMessage>
          </p>

          <p class="text-sm">
            <FormatMessage
              key="admin.storage_template_user_label"
              values={{ label: authManager.user.storageLabel || authManager.user.id }}
            >
              {#snippet children({ message })}
                <code class="text-primary">{message}</code>
              {/snippet}
            </FormatMessage>
          </p>

          <p class="mt-2 rounded-lg bg-gray-200 p-4 py-2 text-xs dark:bg-gray-700 dark:text-immich-dark-fg">
            <span class="text-immich-fg/25 dark:text-immich-dark-fg/50"
              >UPLOAD_LOCATION/library/{authManager.user.storageLabel || authManager.user.id}</span
            >/{renderedPreview}.jpg
          </p>

          <form autocomplete="off" class="flex flex-col" onsubmit={preventDefault(bubble('submit'))}>
            <div class="my-2 flex flex-col">
              {#if templateOptions}
                <label class="text-sm font-medium text-primary" for="preset-select">
                  {$t('preset')}
                </label>
                <select
                  class="mt-2 immich-form-input rounded-lg bg-slate-200 p-2 text-sm hover:cursor-pointer dark:bg-gray-600"
                  disabled={disabled || !configToEdit.storageTemplate.enabled}
                  name="presets"
                  id="preset-select"
                  bind:value={selectedPreset}
                  onchange={handlePresetSelection}
                >
                  {#each templateOptions.presetOptions as preset, i (preset)}
                    <option value={preset}>{templateOptions.renderedPresetOptions[i]}</option>
                  {/each}
                </select>
              {/if}
            </div>

            <div class="flex gap-2 align-bottom">
              <SettingInputField
                label={$t('template')}
                disabled={disabled || !configToEdit.storageTemplate.enabled}
                required
                inputType={SettingInputFieldType.TEXT}
                bind:value={configToEdit.storageTemplate.template}
                isEdited={!(configToEdit.storageTemplate.template === config.storageTemplate.template)}
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
                <Heading size="tiny" color="primary">
                  {$t('notes')}
                </Heading>
                <section class="flex flex-col gap-2">
                  <p>
                    <FormatMessage
                      key="admin.storage_template_migration_info"
                      values={{ job: $t('admin.storage_template_migration_job') }}
                    >
                      {#snippet children({ message })}
                        <a href={Route.queues()} class="text-primary">{message}</a>
                      {/snippet}
                    </FormatMessage>
                  </p>
                </section>
              </div>
            {/if}
          </form>
        </div>
      {/if}

      {#if !minified}
        <SettingButtonsRow bind:configToEdit keys={['storageTemplate']} {disabled} />
      {/if}
    </div>
  {/await}
</section>
