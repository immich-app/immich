<script lang="ts">
  import type { SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { SettingsEventType } from '../admin-settings';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import { t } from 'svelte-i18n';

  export let savedConfig: SystemConfigDto;
  export let defaultConfig: SystemConfigDto;
  export let config: SystemConfigDto; // this is the config that is being edited
  export let disabled = false;

  const cronExpressionOptions = [
    { title: $t('every_night_at_midnight'), expression: '0 0 * * *' },
    { title: $t('every_night_at_twoam'), expression: '0 2 * * *' },
    { title: $t('every_day_at_onepm'), expression: '0 13 * * *' },
    { title: $t('every_six_hours'), expression: '0 */6 * * *' },
  ];

  const dispatch = createEventDispatcher<SettingsEventType>();
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <SettingAccordion
      key="library-watching"
      title={$t('library_watching_(experimental)')}
      subtitle="Automatically watch for changed files"
      isOpen
    >
      <form autocomplete="off" on:submit|preventDefault>
        <div class="ml-4 mt-4 flex flex-col gap-4">
          <SettingSwitch
            title={$t('watch_filesystem')}
            {disabled}
            subtitle="Watch external libraries for file changes"
            bind:checked={config.library.watch.enabled}
          />
        </div>

        <div class="ml-4">
          <SettingButtonsRow
            on:reset={({ detail }) => dispatch('reset', { ...detail, configKeys: ['library'] })}
            on:save={() => dispatch('save', { library: config.library })}
            showResetToDefault={!isEqual(savedConfig.library, defaultConfig.library)}
            {disabled}
          />
        </div>
      </form>
    </SettingAccordion>

    <SettingAccordion
      key="library-scanning"
      title={$t('periodic_scanning')}
      subtitle={$t('configure_periodic_library_scanning')}
      isOpen
    >
      <form autocomplete="off" on:submit|preventDefault>
        <div class="ml-4 mt-4 flex flex-col gap-4">
          <SettingSwitch
<<<<<<< HEAD
            title={$t('enabled')}
=======
            id="periodic-library-scan"
            title={$t('enabled').toUpperCase()}
>>>>>>> 4dcb5a3a3 (Fix lower and uppercase strings. Add a few additional string. Fix a few unnecessary replacements)
            {disabled}
            subtitle={$t('enable_periodic_library_scanning')}
            bind:checked={config.library.scan.enabled}
          />

          <div class="flex flex-col my-2 dark:text-immich-dark-fg">
            <label class="text-sm" for="expression-select">{$t('cron_expression_presets')}</label>
            <select
              class="p-2 mt-2 text-sm rounded-lg bg-slate-200 hover:cursor-pointer dark:bg-gray-600"
              disabled={disabled || !config.library.scan.enabled}
              name="expression"
              id="expression-select"
              bind:value={config.library.scan.cronExpression}
            >
              {#each cronExpressionOptions as { title, expression }}
                <option value={expression}>{title}</option>
              {/each}
            </select>
          </div>

          <SettingInputField
            inputType={SettingInputFieldType.TEXT}
            required={true}
            disabled={disabled || !config.library.scan.enabled}
            label={$t('cron_expression')}
            bind:value={config.library.scan.cronExpression}
            isEdited={config.library.scan.cronExpression !== savedConfig.library.scan.cronExpression}
          >
            <svelte:fragment slot="desc">
              <p class="text-sm dark:text-immich-dark-fg">
                Set the scanning interval using the cron format. For more information please refer to e.g. <a
                  href="https://crontab.guru"
                  class="underline"
                  target="_blank"
                  rel="noreferrer">{$t('crontab_guru')}</a
                >
              </p>
            </svelte:fragment>
          </SettingInputField>
        </div>

        <div class="ml-4">
          <SettingButtonsRow
            on:reset={({ detail }) => dispatch('reset', { ...detail, configKeys: ['library'] })}
            on:save={() => dispatch('save', { library: config.library })}
            showResetToDefault={!isEqual(savedConfig.library, defaultConfig.library)}
            {disabled}
          />
        </div>
      </form>
    </SettingAccordion>
  </div>
</div>
