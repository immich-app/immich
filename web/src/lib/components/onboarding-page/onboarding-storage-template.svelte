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
  <p class="text-xl text-immich-primary dark:text-immich-dark-primary">MODÈLE DE STOCKAGE</p>

  <p>
    Le modèle de stockage est utilisé pour déterminer la structure des dossiers et le nom des fichiers de vos fichiers multimédias.
    Vous pouvez utiliser des variables pour personnaliser le modèle selon vos préférences.
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
