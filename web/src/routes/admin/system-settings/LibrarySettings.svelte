<script lang="ts">
  import SettingAccordion from '#lib/components/shared-components/settings/SettingAccordion.svelte';
  import SettingInputField from '#lib/components/shared-components/settings/SettingInputField.svelte';
  import SettingSwitch from '#lib/components/shared-components/settings/SettingSwitch.svelte';
  import SettingButtonsRow from '#lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import { SettingInputFieldType } from '#lib/constants.ts';
  import FormatMessage from '#lib/elements/FormatMessage.svelte';
  import { createPreloadedQuery } from '#lib/queries/client.ts';
  import { createAdminConfigField, getAdminConfigQuery } from '#lib/queries/config-admin.query.ts';
  import { Link } from '@immich/ui';
  import { cloneDeep } from 'lodash-es';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import SettingSelect from './SettingSelect.svelte';

  const query = createPreloadedQuery(getAdminConfigQuery);
  const config = $derived(query.data);

  let configToEdit = $state(cloneDeep(config));

  const cronField = createAdminConfigField(() => 'library.scan.cronExpression');

  let cronExpressionOptions = $derived([
    { text: $t('interval.night_at_midnight'), value: '0 0 * * *' },
    { text: $t('interval.night_at_twoam'), value: '0 2 * * *' },
    { text: $t('interval.day_at_onepm'), value: '0 13 * * *' },
    { text: $t('interval.hours', { values: { hours: 6 } }), value: '0 */6 * * *' },
  ]);
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" onsubmit={(event) => event.preventDefault()}>
      <div class="ms-4 mt-4 flex flex-col gap-4">
        <SettingAccordion
          key="library-watching"
          title={$t('admin.library_watching_settings')}
          subtitle={$t('admin.library_watching_settings_description')}
        >
          <div class="ms-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title={$t('admin.library_watching_enable_description')}
              key="library.watch.enabled"
              bind:checked={configToEdit.library.watch.enabled}
            />
          </div>
        </SettingAccordion>

        <SettingAccordion
          key="library-scanning"
          title={$t('admin.library_scanning')}
          subtitle={$t('admin.library_scanning_description')}
        >
          <div class="ms-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title={$t('admin.library_scanning_enable_description')}
              key="library.scan.enabled"
              bind:checked={configToEdit.library.scan.enabled}
            />

            <SettingSelect
              options={cronExpressionOptions}
              disabled={!configToEdit.library.scan.enabled || cronField.isLocked}
              name="expression"
              label={$t('admin.cron_expression_presets')}
              bind:value={configToEdit.library.scan.cronExpression}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              required={true}
              disabled={!configToEdit.library.scan.enabled}
              label={$t('admin.cron_expression')}
              key="library.scan.cronExpression"
              bind:value={configToEdit.library.scan.cronExpression}
              isEdited={configToEdit.library.scan.cronExpression !== config.library.scan.cronExpression}
            >
              {#snippet descriptionSnippet()}
                <p class="text-sm dark:text-immich-dark-fg">
                  <FormatMessage key="admin.cron_expression_description">
                    {#snippet children({ message })}
                      <Link
                        href="https://crontab.guru/#{configToEdit.library.scan.cronExpression.replaceAll(' ', '_')}"
                      >
                        {message}
                      </Link>
                    {/snippet}
                  </FormatMessage>
                </p>
              {/snippet}
            </SettingInputField>
          </div>
        </SettingAccordion>

        <SettingButtonsRow bind:configToEdit keys={['library']} />
      </div>
    </form>
  </div>
</div>
