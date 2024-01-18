<script lang="ts">
  import type { SystemConfigDto } from '@api';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
  import SettingSwitch from '../setting-switch.svelte';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import SettingAccordion from '../setting-accordion.svelte';
  import { createEventDispatcher } from 'svelte';
  import type { SettingsEventType } from '../admin-settings';

  export let savedConfig: SystemConfigDto;
  export let defaultConfig: SystemConfigDto;
  export let config: SystemConfigDto; // this is the config that is being edited
  export let disabled = false;

  const cronExpressionOptions = [
    { title: 'Every night at midnight', expression: '0 0 * * *' },
    { title: 'Every night at 2am', expression: '0 2 * * *' },
    { title: 'Every day at 1pm', expression: '0 13 * * *' },
    { title: 'Every 6 hours', expression: '0 */6 * * *' },
  ];

  const dispatch = createEventDispatcher<SettingsEventType>();
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <SettingAccordion title="Scanning" subtitle="Settings for library scanning" isOpen>
      <form autocomplete="off" on:submit|preventDefault>
        <div class="ml-4 mt-4 flex flex-col gap-4">
          <SettingSwitch
            title="ENABLED"
            {disabled}
            subtitle="Enable automatic library scanning"
            bind:checked={config.library.scan.enabled}
          />

          <div class="flex flex-col my-2 dark:text-immich-dark-fg">
            <label class="text-sm" for="expression-select">Cron Expression Presets</label>
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
            label="Cron Expression"
            bind:value={config.library.scan.cronExpression}
            isEdited={config.library.scan.cronExpression !== savedConfig.library.scan.cronExpression}
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
