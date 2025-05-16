<script lang="ts">
  import AdminSettings from '$lib/components/admin-page/settings/admin-settings.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { user } from '$lib/stores/user.store';
  import { getConfig, type SystemConfigDto } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import { mdiArrowLeft, mdiArrowRight, mdiIncognito } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import OnboardingCard from './onboarding-card.svelte';

  interface Props {
    onDone: () => void;
    onPrevious: () => void;
  }

  let { onDone, onPrevious }: Props = $props();

  let config: SystemConfigDto | null = $state(null);
  let adminSettingsComponent = $state<ReturnType<typeof AdminSettings>>();

  onMount(async () => {
    config = await getConfig();
  });
</script>

<OnboardingCard title={$t('privacy')} icon={mdiIncognito}>
  <p>
    {$t('onboarding_privacy_description')}
  </p>

  {#if config && $user}
    <AdminSettings bind:config bind:this={adminSettingsComponent}>
      {#if config}
        <SettingSwitch
          title={$t('admin.map_settings')}
          subtitle={$t('admin.map_implications')}
          bind:checked={config.map.enabled}
        />
        <SettingSwitch
          title={$t('admin.version_check_settings')}
          subtitle={$t('admin.version_check_implications')}
          bind:checked={config.newVersionCheck.enabled}
        />
        <div class="flex pt-4">
          <div class="w-full flex place-content-start">
            <Button
              shape="round"
              leadingIcon={mdiArrowLeft}
              class="flex gap-2 place-content-center"
              onclick={() => onPrevious()}
            >
              <p>{$t('theme')}</p>
            </Button>
          </div>
          <div class="flex w-full place-content-end">
            <Button
              shape="round"
              trailingIcon={mdiArrowRight}
              onclick={() => {
                adminSettingsComponent?.handleSave({ map: config?.map, newVersionCheck: config?.newVersionCheck });
                onDone();
              }}
            >
              <span class="flex place-content-center place-items-center gap-2">
                {$t('admin.storage_template_settings')}
              </span>
            </Button>
          </div>
        </div>
      {/if}
    </AdminSettings>
  {/if}
</OnboardingCard>
