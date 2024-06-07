<script lang="ts">
  import { mdiArrowRight } from '@mdi/js';
  import Button from '../elements/buttons/button.svelte';
  import Icon from '../elements/icon.svelte';
  import OnboardingCard from './onboarding-card.svelte';
  import { createEventDispatcher } from 'svelte';
  import { colorTheme } from '$lib/stores/preferences.store';
  import { moonPath, moonViewBox, sunPath, sunViewBox } from '$lib/assets/svg-paths';
  import { Theme } from '$lib/constants';
  import { t } from 'svelte-i18n';

  const dispatch = createEventDispatcher<{
    done: void;
    previous: void;
  }>();
</script>

<OnboardingCard>
  <p class="text-xl text-immich-primary dark:text-immich-dark-primary">{$t('color_theme').toUpperCase()}</p>

  <div>
    <p class="pb-6 font-light">Choose a color theme for your instance. You can change this later in your settings.</p>
  </div>

  <div class="flex gap-4 mb-6">
    <button
      type="button"
      class="w-1/2 aspect-square bg-immich-bg rounded-3xl transition-all shadow-sm hover:shadow-xl border-[3px] border-immich-dark-primary/80 border-immich-primary dark:border dark:border-transparent"
      on:click={() => ($colorTheme.value = Theme.LIGHT)}
    >
      <div
        class="flex flex-col place-items-center place-content-center justify-around h-full w-full text-immich-primary"
      >
        <Icon path={sunPath} viewBox={sunViewBox} size="96" />
        <p class="font-semibold text-4xl">{$t('light').toUpperCase()}</p>
      </div>
    </button>
    <button
      type="button"
      class="w-1/2 aspect-square bg-immich-dark-bg rounded-3xl dark:border-[3px] dark:border-immich-dark-primary/80 dark:border-immich-dark-primary border border-transparent"
      on:click={() => ($colorTheme.value = Theme.DARK)}
    >
      <div
        class="flex flex-col place-items-center place-content-center justify-around h-full w-full text-immich-dark-primary"
      >
        <Icon path={moonPath} viewBox={moonViewBox} size="96" />
        <p class="font-semibold text-4xl">{$t('dark').toUpperCase()}</p>
      </div>
    </button>
  </div>

  <div class="flex">
    <div class="w-full flex place-content-end">
      <Button class="flex gap-2 place-content-center" on:click={() => dispatch('done')}>
        <p>{$t('admin.storage_template_settings')}</p>
        <Icon path={mdiArrowRight} size="18" />
      </Button>
    </div>
  </div>
</OnboardingCard>
