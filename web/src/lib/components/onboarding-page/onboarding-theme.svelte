<script lang="ts">
  import { mdiArrowRight, mdiWhiteBalanceSunny, mdiMoonWaningCrescent } from '@mdi/js';
  import Button from '../elements/buttons/button.svelte';
  import Icon from '../elements/icon.svelte';
  import OnboardingCard from './onboarding-card.svelte';
  import { createEventDispatcher } from 'svelte';
  import { colorTheme } from '$lib/stores/preferences.store';

  const dispatch = createEventDispatcher<{
    done: void;
  }>();

  const toggleLightTheme = () => {
    $colorTheme = 'light';
  };

  const toggleDarkTheme = () => {
    $colorTheme = 'dark';
  };
</script>

<OnboardingCard>
  <p class="text-xl text-immich-primary dark:text-immich-dark-primary">COLOR THEME</p>

  <div>
    <p class="pb-6 font-light">Choose a color theme for your instance. You can change this later in your settings.</p>
  </div>

  <div class="flex gap-4 mb-6">
    <button
      class="w-1/2 aspect-square bg-immich-bg rounded-3xl transition-all shadow-sm hover:shadow-xl {$colorTheme ==
      'light'
        ? 'border-[3px] border-immich-dark-primary/80 border-immich-primary'
        : 'border border-transparent'}"
      on:click={toggleLightTheme}
    >
      <div
        class="flex flex-col place-items-center place-content-center justify-around h-full w-full text-immich-primary"
      >
        <Icon path={mdiWhiteBalanceSunny} size="96" />
        <p class="font-semibold text-4xl">LIGHT</p>
      </div>
    </button>
    <button
      class="w-1/2 aspect-square bg-immich-dark-bg rounded-3xl {$colorTheme == 'dark'
        ? 'border-[3px] border-immich-dark-primary/80 border-immich-primary'
        : 'border border-transparent'}"
      on:click={toggleDarkTheme}
    >
      <div
        class="flex flex-col place-items-center place-content-center justify-around h-full w-full text-immich-dark-primary"
      >
        <Icon path={mdiMoonWaningCrescent} size="96" />
        <p class="font-semibold text-4xl">DARK</p>
      </div>
    </button>
  </div>

  <div class="w-full flex place-content-end">
    <Button class="flex gap-2 place-content-center" on:click={() => dispatch('done')}>
      <p>Storage Template</p>
      <Icon path={mdiArrowRight} size="18" />
    </Button>
  </div>
</OnboardingCard>
