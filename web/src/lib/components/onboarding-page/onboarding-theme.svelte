<script lang="ts">
  import { moonPath, moonViewBox, sunPath, sunViewBox } from '$lib/assets/svg-paths';
  import { Theme } from '$lib/constants';
  import { themeManager } from '$lib/managers/theme-manager.svelte';
  import { Icon } from '@immich/ui';
  import { t } from 'svelte-i18n';
</script>

<div class="flex flex-col gap-4">
  <p>{$t('onboarding_theme_description')}</p>

  <div class="flex gap-4">
    <button
      type="button"
      class="w-1/2 aspect-square bg-light dark:bg-dark rounded-3xl transition-all shadow-sm hover:shadow-xl border-[3px] border-immich-primary dark:border dark:border-transparent"
      onclick={() => themeManager.setTheme(Theme.LIGHT)}
    >
      <div
        class="flex flex-col place-items-center place-content-center justify-around h-full w-full text-immich-primary"
      >
        <Icon icon={sunPath} viewBox={sunViewBox} size="96" />
        <p class="uppercase font-semibold text-4xl">{$t('light')}</p>
      </div>
    </button>
    <button
      type="button"
      class="w-1/2 aspect-square bg-dark dark:bg-light rounded-3xl transition-all shadow-sm hover:shadow-xl dark:border-[3px] dark:border-immich-dark-primary border border-transparent"
      onclick={() => themeManager.setTheme(Theme.DARK)}
    >
      <div
        class="flex flex-col place-items-center place-content-center justify-around h-full w-full text-immich-dark-primary"
      >
        <Icon icon={moonPath} viewBox={moonViewBox} size="96" />
        <p class="uppercase font-semibold text-4xl">{$t('dark')}</p>
      </div>
    </button>
  </div>
</div>
