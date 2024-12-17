<script lang="ts">
  import { user } from '$lib/stores/user.store';
  import { getConfig, type SystemConfigDto } from '@immich/sdk';
  import { mdiArrowLeft, mdiArrowRight, mdiIncognito } from '@mdi/js';
  import { onMount } from 'svelte';
  import AdminSettings from '$lib/components/admin-page/settings/admin-settings.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import OnboardingCard from './onboarding-card.svelte';
  import { t } from 'svelte-i18n';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';

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
      {#snippet children()}
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
              <Button class="flex gap-2 place-content-center" onclick={() => onPrevious()}>
                <Icon path={mdiArrowLeft} size="18" />
                <p>{$t('theme')}</p>
              </Button>
            </div>
            <div class="flex w-full place-content-end">
              <Button
                onclick={() => {
                  adminSettingsComponent?.handleSave({ map: config?.map, newVersionCheck: config?.newVersionCheck });
                  onDone();
                }}
              >
                <span class="flex place-content-center place-items-center gap-2">
                  {$t('admin.storage_template_settings')}
                  <Icon path={mdiArrowRight} size="18" />
                </span>
              </Button>
            </div>
          </div>
        {/if}
      {/snippet}
    </AdminSettings>
  {/if}
</OnboardingCard>
