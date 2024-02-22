<script lang="ts">
  import { featureFlags } from '$lib/stores/server-config.store';
  import { user } from '$lib/stores/user.store';
  import { getConfig, type SystemConfigDto } from '@immich/sdk';
  import { mdiArrowLeft, mdiCheck } from '@mdi/js';
  import { createEventDispatcher, onMount } from 'svelte';
  import AdminSettings from '../admin-page/settings/admin-settings.svelte';
  import StorageTemplateSettings from '../admin-page/settings/storage-template/storage-template-settings.svelte';
  import Button from '../elements/buttons/button.svelte';
  import Icon from '../elements/icon.svelte';
  import OnboardingCard from './onboarding-card.svelte';

  const dispatch = createEventDispatcher<{
    done: void;
    previous: void;
  }>();

  let config: SystemConfigDto | null = null;

  onMount(async () => {
    config = await getConfig();
  });
</script>

<OnboardingCard>
  <p class="text-xl text-immich-primary dark:text-immich-dark-primary">STORAGE TEMPLATE</p>

  <p>
    Let’s get your files sorted with our Storage Template Engine.<br />Turning on this feature means your files get
    neatly organized without any extra effort from you.<br />Not a fan of auto-organizing? You can simply switch it off
    and your files will chill out in the 'upload' folder.<br />It’s all about what makes sense for you. And hey, you can
    flip the switch anytime.<br />Need more info? Just hop over to our
    <a href="https://immich.app/docs/administration/backup-and-restore/#asset-types-and-storage-locations"
      >documentation</a
    >. We’re here to help!
  </p>

  {#if config && $user}
    <AdminSettings bind:config let:defaultConfig let:savedConfig let:handleSave let:handleReset>
      <StorageTemplateSettings
        minified
        disabled={$featureFlags.configFile}
        {config}
        {defaultConfig}
        {savedConfig}
        on:save={({ detail }) => handleSave(detail)}
        on:reset={({ detail }) => handleReset(detail)}
      >
        <div class="flex pt-4">
          <div class="w-full flex place-content-start">
            <Button class="flex gap-2 place-content-center" on:click={() => dispatch('previous')}>
              <Icon path={mdiArrowLeft} size="18" />
              <p>Theme</p>
            </Button>
          </div>
          <div class="flex w-full place-content-end">
            <Button
              on:click={() => {
                handleSave({ storageTemplate: config?.storageTemplate });
                dispatch('done');
              }}
            >
              <span class="flex place-content-center place-items-center gap-2">
                Done
                <Icon path={mdiCheck} size="18" />
              </span>
            </Button>
          </div>
        </div>
      </StorageTemplateSettings>
    </AdminSettings>
  {/if}
</OnboardingCard>
