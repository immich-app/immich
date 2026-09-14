<script lang="ts">
  import SettingInputField from '$lib/components/shared-components/settings/SettingInputField.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/SettingSwitch.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import StorageTemplateVariablesModal from '$lib/modals/StorageTemplateVariablesModal.svelte';
  import { Route } from '$lib/route';
  import { handleSystemConfigSave } from '$lib/services/system-config.service';
  import { getStorageTemplateOptions, type SystemConfigTemplateStorageOptionDto } from '@immich/sdk';
  import { Code, Heading, IconButton, Link, modalManager, Text } from '@immich/ui';
  import { mdiInformationOutline } from '@mdi/js';
  import handlebar from 'handlebars';
  import * as luxon from 'luxon';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fade, slide } from 'svelte/transition';

  type Props = {
    minified?: boolean;
    duration?: number;
    saveOnClose?: boolean;
  };

  const { minified = false, duration = 500, saveOnClose = false }: Props = $props();

  const DATE_TEMPLATE = '{{y}}/{{MM}}/{{dd}}/{{filename}}';

  const StorageTemplateOption = {
    None: 'none',
    Date: 'date',
    Custom: 'custom',
  } as const;

  type StorageTemplateOption = (typeof StorageTemplateOption)[keyof typeof StorageTemplateOption];

  const disabled = $derived(featureFlagsManager.value.configFile);
  const config = $derived(systemConfigManager.value);
  let configToEdit = $state(systemConfigManager.cloneValue());

  let templateOptions: SystemConfigTemplateStorageOptionDto | undefined = $state();
  let selectedPreset = $state('');
  let customTemplate = $state(systemConfigManager.value.storageTemplate.template);

  const getTemplateOptions = async () => {
    templateOptions = await getStorageTemplateOptions();
    selectedPreset = config.storageTemplate.template;
  };

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
      make: 'FUJIFILM',
      model: 'X-T50',
      lensModel: 'XF27mm F2.8 R WR',
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
    configToEdit.storageTemplate.template = selectedPreset;
  };

  let selectedOption = $state(
    configToEdit.storageTemplate.enabled
      ? configToEdit.storageTemplate.template === DATE_TEMPLATE
        ? StorageTemplateOption.Date
        : StorageTemplateOption.Custom
      : StorageTemplateOption.None,
  );

  const handleOptionSelection = (option: StorageTemplateOption) => {
    if (selectedOption === StorageTemplateOption.Custom) {
      customTemplate = configToEdit.storageTemplate.template;
    }

    const templates: Record<StorageTemplateOption, string> = {
      [StorageTemplateOption.None]: configToEdit.storageTemplate.template,
      [StorageTemplateOption.Date]: DATE_TEMPLATE,
      [StorageTemplateOption.Custom]: customTemplate,
    };

    selectedOption = option;
    configToEdit.storageTemplate.enabled = option !== StorageTemplateOption.None;
    configToEdit.storageTemplate.template = templates[option];
  };

  const handleShowVariables = async () => {
    if (templateOptions) {
      await modalManager.show(StorageTemplateVariablesModal, { options: templateOptions });
    }
  };

  let parsedCustomTemplate = $derived(() => {
    try {
      return renderTemplate(
        selectedOption === StorageTemplateOption.Custom ? configToEdit.storageTemplate.template : customTemplate,
      );
    } catch {
      return 'error';
    }
  });

  onDestroy(async () => {
    if (saveOnClose) {
      await handleSystemConfigSave({ storageTemplate: configToEdit.storageTemplate });
    }
  });
</script>

{#snippet templateOption(option: StorageTemplateOption, label: string, description: string, preview: string)}
  <div
    class="flex flex-col rounded-2xl border-2 p-4 transition-colors {selectedOption === option
      ? 'border-primary bg-primary/5'
      : 'border-primary/10 hover:border-primary/20'} {disabled ? 'opacity-50' : ''}"
  >
    <label class="flex items-center gap-3 {disabled ? 'cursor-not-allowed' : 'cursor-pointer'}">
      <input
        type="radio"
        name="storage-template-option"
        class="accent-primary focus-visible:ring"
        {disabled}
        checked={selectedOption === option}
        onchange={() => handleOptionSelection(option)}
      />
      <div class="flex flex-col">
        <span class="font-medium">{label}</span>
        <Text size="small" color="muted">{description}</Text>
      </div>
    </label>

    {#if option === StorageTemplateOption.Custom && selectedOption === StorageTemplateOption.Custom}
      <div class="mt-4 flex flex-col gap-2" transition:slide={{ duration: 200 }}>
        <div class="flex flex-col">
          <label class="text-sm font-medium text-primary" for="preset-select">
            {$t('preset')}
          </label>
          <select
            class="mt-2 immich-form-input rounded-lg bg-slate-200 p-2 text-sm hover:cursor-pointer dark:bg-gray-600"
            {disabled}
            name="presets"
            id="preset-select"
            bind:value={selectedPreset}
            onchange={handlePresetSelection}
          >
            {#each templateOptions?.presetOptions ?? [] as preset (preset)}
              <option value={preset}>{renderTemplate(preset)}</option>
            {/each}
          </select>
        </div>

        <SettingInputField
          label={$t('template')}
          {disabled}
          required
          inputType={SettingInputFieldType.TEXT}
          bind:value={configToEdit.storageTemplate.template}
          isEdited={configToEdit.storageTemplate.template !== config.storageTemplate.template}
        >
          {#snippet trailingSnippet()}
            <IconButton
              class="shrink-0"
              size="small"
              shape="round"
              variant="ghost"
              color="secondary"
              aria-label={$t('admin.storage_template_variables')}
              title={$t('admin.storage_template_variables')}
              icon={mdiInformationOutline}
              onclick={handleShowVariables}
            />
          {/snippet}
        </SettingInputField>

        <Text size="small">
          <FormatMessage
            key="admin.storage_template_path_length"
            values={{
              length: preview.length + authManager.user.id.length + 'UPLOAD_LOCATION'.length,
              limit: 260,
            }}
          >
            {#snippet children({ message })}
              <span class="font-semibold text-primary">{message}</span>
            {/snippet}
          </FormatMessage>
        </Text>

        <Text size="small">
          <FormatMessage
            key="admin.storage_template_user_label"
            values={{ label: authManager.user.storageLabel || authManager.user.id }}
          >
            {#snippet children({ message })}
              <code class="text-primary">{message}</code>
            {/snippet}
          </FormatMessage>
        </Text>
      </div>
    {/if}

    {#if preview}
      <Text size="small" class="mt-4">
        {$t('preview')}:
        <Code size="small"
          >{`UPLOAD_LOCATION/library/${authManager.user.storageLabel || authManager.user.id}/${preview}.jpg`}</Code
        >
      </Text>
    {/if}
  </div>
{/snippet}

<section class="mt-2 dark:text-immich-dark-fg">
  {#if !minified}
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
  {/if}

  {#await getTemplateOptions() then}
    <div id="directory-path-builder" class="flex flex-col gap-4 {minified ? '' : 'ms-4 mt-4'}">
      <div class="flex flex-col gap-2">
        {@render templateOption(
          StorageTemplateOption.None,
          $t('admin.storage_template_option_none'),
          $t('admin.storage_template_option_none_description'),
          '',
        )}
        {@render templateOption(
          StorageTemplateOption.Date,
          'YYYY/MM/DD',
          $t('admin.storage_template_option_date_description'),
          renderTemplate(DATE_TEMPLATE),
        )}
        {@render templateOption(
          StorageTemplateOption.Custom,
          $t('admin.storage_template_option_custom'),
          $t('admin.storage_template_option_custom_description'),
          parsedCustomTemplate(),
        )}
      </div>

      {#if !minified}
        <SettingSwitch
          title={$t('admin.storage_template_hash_verification_enabled')}
          {disabled}
          subtitle={$t('admin.storage_template_hash_verification_enabled_description')}
          bind:checked={configToEdit.storageTemplate.hashVerificationEnabled}
          isEdited={configToEdit.storageTemplate.hashVerificationEnabled !==
            config.storageTemplate.hashVerificationEnabled}
        />

        {#if configToEdit.storageTemplate.enabled}
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

        <SettingButtonsRow bind:configToEdit keys={['storageTemplate']} {disabled} />
      {/if}
    </div>
  {/await}
</section>
