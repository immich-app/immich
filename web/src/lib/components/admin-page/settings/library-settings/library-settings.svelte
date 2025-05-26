<script lang="ts">
  import type { SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import { t } from 'svelte-i18n';
  import FormatMessage from '$lib/components/i18n/format-message.svelte';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import { SettingInputFieldType } from '$lib/constants';

  interface Props {
    savedConfig: SystemConfigDto;
    defaultConfig: SystemConfigDto;
    config: SystemConfigDto;
    disabled?: boolean;
    onReset: SettingsResetEvent;
    onSave: SettingsSaveEvent;
    openByDefault?: boolean;
  }

  let {
    savedConfig,
    defaultConfig,
    config = $bindable(),
    disabled = false,
    onReset,
    onSave,
    openByDefault = false,
  }: Props = $props();

  let cronExpressionOptions = $derived([
    { text: $t('interval.night_at_midnight'), value: '0 0 * * *' },
    { text: $t('interval.night_at_twoam'), value: '0 2 * * *' },
    { text: $t('interval.day_at_onepm'), value: '0 13 * * *' },
    { text: $t('interval.hours', { values: { hours: 6 } }), value: '0 */6 * * *' },
  ]);

  const onsubmit = (event: Event) => {
    event.preventDefault();
  };
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" {onsubmit}>
      <div class="ms-4 mt-4 flex flex-col gap-4">
        <SettingAccordion
          key="library-watching"
          title={$t('admin.library_watching_settings')}
          subtitle={$t('admin.library_watching_settings_description')}
          isOpen={openByDefault}
        >
          <div class="ms-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title={$t('admin.library_watching_enable_description')}
              {disabled}
              bind:checked={config.library.watch.enabled}
            />
          </div>
        </SettingAccordion>

        <SettingAccordion
          key="library-scanning"
          title={$t('admin.library_scanning')}
          subtitle={$t('admin.library_scanning_description')}
          isOpen={openByDefault}
        >
          <div class="ms-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title={$t('admin.library_scanning_enable_description')}
              {disabled}
              bind:checked={config.library.scan.enabled}
            />

            <SettingSelect
              options={cronExpressionOptions}
              disabled={disabled || !config.library.scan.enabled}
              name="expression"
              label={$t('admin.cron_expression_presets')}
              bind:value={config.library.scan.cronExpression}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              required={true}
              disabled={disabled || !config.library.scan.enabled}
              label={$t('admin.cron_expression')}
              bind:value={config.library.scan.cronExpression}
              isEdited={config.library.scan.cronExpression !== savedConfig.library.scan.cronExpression}
            >
              {#snippet descriptionSnippet()}
                <p class="text-sm dark:text-immich-dark-fg">
                  <FormatMessage key="admin.cron_expression_description">
                    {#snippet children({ message })}
                      <a
                        href="https://crontab.guru/#{config.library.scan.cronExpression.replaceAll(' ', '_')}"
                        class="underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {message}
                      </a>
                    {/snippet}
                  </FormatMessage>
                </p>
              {/snippet}
            </SettingInputField>
          </div>
        </SettingAccordion>

        <SettingButtonsRow
          onReset={(options) => onReset({ ...options, configKeys: ['library'] })}
          onSave={() => onSave({ library: config.library })}
          showResetToDefault={!isEqual(savedConfig.library, defaultConfig.library)}
          {disabled}
        />
      </div>
    </form>
  </div>
</div>
