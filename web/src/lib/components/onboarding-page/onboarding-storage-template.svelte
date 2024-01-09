<script lang="ts">
  import OnboardingCard from './onboarding-card.svelte';
  import { createEventDispatcher, onMount } from 'svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  import StorageTemplateSettings from '../admin-page/settings/storage-template/storage-template-settings.svelte';
  import { SystemConfigDto, api } from '@api';
  import { user } from '$lib/stores/user.store';

  const dispatch = createEventDispatcher<{
    done: void;
    previous: void;
  }>();

  let configs: SystemConfigDto | null = null;

  onMount(async () => {
    const { data } = await api.systemConfigApi.getConfig();
    configs = data;
  });
</script>

<OnboardingCard>
  <p class="text-xl text-immich-primary dark:text-immich-dark-primary">STORAGE TEMPLATE</p>

  <p>
    The storage template is used to determine the folder structure and file name of your media files. You can use
    variables to customize the template to your liking.
  </p>

  {#if configs && $user}
    <StorageTemplateSettings
      minified
      disabled={$featureFlags.configFile}
      storageConfig={configs.storageTemplate}
      on:save={() => dispatch('done')}
      on:previous={() => dispatch('previous')}
    />
  {/if}
</OnboardingCard>
