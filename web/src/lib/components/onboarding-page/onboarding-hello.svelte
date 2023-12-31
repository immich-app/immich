<script lang="ts">
  import OnboardingCard from './onboarding-card.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import settingUrl from '$lib/assets/settings-outline.svg';
  import { mdiArrowRight } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    done: void;
  }>();
</script>

<OnboardingCard>
  <p class="font-medium text-6xl pb-6">Welcome to Immich!</p>
  <p class="text-3xl pb-6 font-light">Let's get your instance setup with some common settings</p>

  <div class="w-full flex place-content-end">
    <Button class="flex gap-2 place-content-center" on:click={() => dispatch('done')}>
      <p>Theme</p>
      <Icon path={mdiArrowRight} size="18" />
    </Button>
  </div>
</OnboardingCard>
