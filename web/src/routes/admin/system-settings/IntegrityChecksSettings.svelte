<script lang="ts">
  import SettingAccordion from '$lib/components/shared-components/settings/SettingAccordion.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/SettingInputField.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/SettingSwitch.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { Link } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const disabled = $derived(featureFlagsManager.value.configFile);
  const config = $derived(systemConfigManager.value);
  let configToEdit = $state(systemConfigManager.cloneValue());
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" onsubmit={(event) => event.preventDefault()}>
      <div class="ms-4 mt-4 flex flex-col gap-4">
        <SettingAccordion
          key="integrity-checks-missing-files"
          title={$t('admin.integrity_checks_missing_files')}
          subtitle={$t('admin.integrity_checks_missing_files_description')}
        >
          <div class="ms-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title={$t('admin.integrity_checks_missing_files_enable_description')}
              {disabled}
              bind:checked={configToEdit.integrityChecks.missingFiles.enabled}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label={$t('admin.cron_expression')}
              bind:value={configToEdit.integrityChecks.missingFiles.cronExpression}
              required={true}
              {disabled}
              isEdited={configToEdit.integrityChecks.missingFiles.cronExpression !==
                config.integrityChecks.missingFiles.cronExpression}
            >
              {#snippet descriptionSnippet()}
                <p class="text-sm dark:text-immich-dark-fg">
                  <FormatMessage key="admin.cron_expression_description">
                    {#snippet children({ message })}
                      <Link
                        href="https://crontab.guru/#{configToEdit.backup.database.cronExpression.replaceAll(' ', '_')}"
                      >
                        {message}
                        <br />
                      </Link>
                    {/snippet}
                  </FormatMessage>
                </p>
              {/snippet}
            </SettingInputField>
          </div>
        </SettingAccordion>

        <SettingAccordion
          key="integrity-checks-untracked-files"
          title={$t('admin.integrity_checks_untracked_files')}
          subtitle={$t('admin.integrity_checks_untracked_files_description')}
        >
          <div class="ms-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title={$t('admin.integrity_checks_untracked_files_enable_description')}
              {disabled}
              bind:checked={configToEdit.integrityChecks.untrackedFiles.enabled}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label={$t('admin.cron_expression')}
              bind:value={configToEdit.integrityChecks.untrackedFiles.cronExpression}
              required={true}
              {disabled}
              isEdited={configToEdit.integrityChecks.untrackedFiles.cronExpression !==
                config.integrityChecks.untrackedFiles.cronExpression}
            >
              {#snippet descriptionSnippet()}
                <p class="text-sm dark:text-immich-dark-fg">
                  <FormatMessage key="admin.cron_expression_description">
                    {#snippet children({ message })}
                      <Link
                        href="https://crontab.guru/#{configToEdit.backup.database.cronExpression.replaceAll(' ', '_')}"
                      >
                        {message}
                        <br />
                      </Link>
                    {/snippet}
                  </FormatMessage>
                </p>
              {/snippet}
            </SettingInputField>
          </div>
        </SettingAccordion>

        <SettingAccordion
          key="integrity-checks-checksum-files"
          title={$t('admin.integrity_checks_checksum_files')}
          subtitle={$t('admin.integrity_checks_checksum_files_description')}
        >
          <div class="ms-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title={$t('admin.integrity_checks_checksum_files_enable_description')}
              {disabled}
              bind:checked={configToEdit.integrityChecks.checksumFiles.enabled}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label={$t('admin.cron_expression')}
              bind:value={configToEdit.integrityChecks.checksumFiles.cronExpression}
              required={true}
              {disabled}
              isEdited={configToEdit.integrityChecks.checksumFiles.cronExpression !==
                config.integrityChecks.checksumFiles.cronExpression}
            >
              {#snippet descriptionSnippet()}
                <p class="text-sm dark:text-immich-dark-fg">
                  <FormatMessage key="admin.cron_expression_description">
                    {#snippet children({ message })}
                      <Link
                        href="https://crontab.guru/#{configToEdit.backup.database.cronExpression.replaceAll(' ', '_')}"
                      >
                        {message}
                        <br />
                      </Link>
                    {/snippet}
                  </FormatMessage>
                </p>
              {/snippet}
            </SettingInputField>

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label={$t('admin.integrity_checks_checksum_files_time_limit')}
              description={$t('admin.integrity_checks_checksum_files_time_limit_description')}
              bind:value={configToEdit.integrityChecks.checksumFiles.timeLimit}
              {disabled}
              isEdited={configToEdit.integrityChecks.checksumFiles.timeLimit !==
                config.integrityChecks.checksumFiles.timeLimit}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label={$t('admin.integrity_checks_checksum_files_percentage_limit')}
              description={$t('admin.integrity_checks_checksum_files_percentage_limit_description')}
              bind:value={configToEdit.integrityChecks.checksumFiles.percentageLimit}
              step="0.01"
              min={0.01}
              max={1}
              {disabled}
              isEdited={configToEdit.integrityChecks.checksumFiles.percentageLimit !==
                config.integrityChecks.checksumFiles.percentageLimit}
            />
          </div>
        </SettingAccordion>

        <SettingButtonsRow bind:configToEdit keys={['integrityChecks']} {disabled} />
      </div>
    </form>
  </div>
</div>
