<script lang="ts">
  import { featureFlags } from '$lib/stores/server-config.store';
  import { user } from '$lib/stores/user.store';
  import { getConfig, type SystemConfigDto } from '@immich/sdk';
  import { mdiArrowLeft, mdiCheck, mdiHarddisk } from '@mdi/js';
  import { onMount } from 'svelte';
  import AdminSettings from '$lib/components/admin-page/settings/admin-settings.svelte';
  import StorageTemplateSettings from '$lib/components/admin-page/settings/storage-template/storage-template-settings.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import OnboardingCard from './onboarding-card.svelte';
  import { t } from 'svelte-i18n';
  import FormatMessage from '$lib/components/i18n/format-message.svelte';

  export let onDone: () => void;
  export let onPrevious: () => void;

  let config: SystemConfigDto | null = null;

  onMount(async () => {
    config = await getConfig();
  });
</script>

<OnboardingCard title={$t('admin.storage_template_settings')} icon={mdiHarddisk}>
  <p>
    <FormatMessage key="admin.storage_template_onboarding_description" let:message>
      <a class="underline" href="https://immich.app/docs/administration/storage-template">{message}</a>
    </FormatMessage>
  </p>

  {#if config && $user}
    <AdminSettings bind:config let:defaultConfig let:savedConfig let:handleSave let:handleReset>
      <StorageTemplateSettings
        minified
        disabled={$featureFlags.configFile}
        {config}
        {defaultConfig}
        {savedConfig}
        onSave={(config) => handleSave(config)}
        onReset={(options) => handleReset(options)}
        duration={0}
      >
        <div class="flex pt-4">
          <div class="w-full flex place-content-start">
            <Button class="flex gap-2 place-content-center" on:click={() => onPrevious()}>
              <Icon path={mdiArrowLeft} size="18" />
              <p>{$t('theme')}</p>
            </Button>
          </div>
          <div class="flex w-full place-content-end">
            <Button
              on:click={() => {
                handleSave({ storageTemplate: config?.storageTemplate });
                onDone();
              }}
            >
              <span class="flex place-content-center place-items-center gap-2">
                {$t('done')}
                <Icon path={mdiCheck} size="18" />
              </span>
            </Button>
          </div>
        </div>
      </StorageTemplateSettings>
    </AdminSettings>
  {/if}
</OnboardingCard>
