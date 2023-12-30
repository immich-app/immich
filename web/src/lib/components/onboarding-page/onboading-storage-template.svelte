<script lang="ts">
  import { mdiArrowRight } from '@mdi/js';
  import Button from '../elements/buttons/button.svelte';
  import Icon from '../elements/icon.svelte';
  import OnboardingCard from './onboarding-card.svelte';
  import { createEventDispatcher, onMount } from 'svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  import StorageTemplateSettings from '../admin-page/settings/storage-template/storage-template-settings.svelte';
  import { SystemConfigDto, api } from '@api';
  import { user } from '$lib/stores/user.store';

  const dispatch = createEventDispatcher<{
    done: void;
  }>();

  let configs: SystemConfigDto | null = null;

  onMount(async () => {
    const { data } = await api.systemConfigApi.getConfig();
    console.log(data);
    configs = data;
  });
</script>

<OnboardingCard>
  <p>Storage Template</p>
  {#if configs && $user}
    <StorageTemplateSettings simple disabled={$featureFlags.configFile} storageConfig={configs.storageTemplate} />
  {/if}
  <div class="w-full flex place-content-end">
    <Button class="flex gap-2 place-content-center" on:click={() => dispatch('done')}>
      <p>Done</p>
      <Icon path={mdiArrowRight} size="18" />
    </Button>
  </div>
</OnboardingCard>
