<script lang="ts">
  import { moonPath, moonViewBox, sunPath, sunViewBox } from '$lib/assets/svg-paths';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { Theme } from '$lib/constants';
  import { themeManager } from '$lib/managers/theme-manager.svelte';
  import { mdiArrowRight, mdiThemeLightDark } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import OnboardingCard from './onboarding-card.svelte';

  interface Props {
    onDone: () => void;
  }

  let { onDone }: Props = $props();
</script>

<OnboardingCard icon={mdiThemeLightDark} title={$t('color_theme')}>
  <div>
    <p class="pb-6 font-light">{$t('onboarding_theme_description')}</p>
  </div>

  <div class="flex gap-4 mb-6">
    <button
      type="button"
      class="w-1/2 aspect-square bg-immich-bg rounded-3xl transition-all shadow-sm hover:shadow-xl border-[3px] border-immich-dark-primary/80 border-immich-primary dark:border dark:border-transparent"
      onclick={() => themeManager.setTheme(Theme.LIGHT)}
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
      onclick={() => themeManager.setTheme(Theme.DARK)}
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
      <Button class="flex gap-2 place-content-center" onclick={() => onDone()}>
        <p>{$t('privacy')}</p>
        <Icon path={mdiArrowRight} size="18" />
      </Button>
    </div>
  </div>
</OnboardingCard>
