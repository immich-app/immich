<script lang="ts">
  import OnboardingCard from './onboarding-card.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import { mdiArrowRight } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';
  import { createEventDispatcher } from 'svelte';
  import ImmichLogo from '../shared-components/immich-logo.svelte';
  import { user } from '$lib/stores/user.store';

  const dispatch = createEventDispatcher<{
    done: void;
  }>();
</script>

<OnboardingCard>
  <ImmichLogo class="w-12 h-12" />
  <p class="font-medium text-6xl my-6 text-immich-primary dark:text-immich-dark-primary">
    Welcome, {$user.name}
  </p>
  <p class="text-3xl pb-6 font-light">Let's get your instance set up with some common settings.</p>

  <div class="w-full flex place-content-end">
    <Button class="flex gap-2 place-content-center" on:click={() => dispatch('done')}>
      <p>Theme</p>
      <Icon path={mdiArrowRight} size="18" />
    </Button>
  </div>
</OnboardingCard>
