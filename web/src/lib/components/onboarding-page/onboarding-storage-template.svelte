<script lang="ts">
  import OnboardingCard from './onboarding-card.svelte';
  import { createEventDispatcher, onMount } from 'svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  import StorageTemplateSettings from '../admin-page/settings/storage-template/storage-template-settings.svelte';
  import { SystemConfigDto, api } from '@api';
  import { user } from '$lib/stores/user.store';
  import AdminSettings from '../admin-page/settings/admin-settings.svelte';

  const dispatch = createEventDispatcher<{
    done: void;
  }>();

  let config: SystemConfigDto | null = null;

  onMount(async () => {
    const { data } = await api.systemConfigApi.getConfig();
    config = data;
  });
</script>

<OnboardingCard>
  <p class="text-xl text-immich-primary dark:text-immich-dark-primary">STORAGE TEMPLATE</p>

  <p>
    The storage template is used to determine the folder structure and file name of your media files. You can use
    variables to customize the template to your liking.
  </p>

  {#if config && $user}
    <AdminSettings
      {config}
      let:defaultConfig
      let:savedConfig
      let:handleSave
      let:handleReset
      on:save={() => dispatch('done')}
    >
      <StorageTemplateSettings
        minified
        disabled={$featureFlags.configFile}
        {config}
        {defaultConfig}
        {savedConfig}
        on:save={({ detail }) => handleSave(detail)}
        on:reset={({ detail }) => handleReset(detail)}
      />
    </AdminSettings>
  {/if}
</OnboardingCard>
