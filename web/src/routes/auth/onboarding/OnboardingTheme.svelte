<script lang="ts">
  import { moonPath, moonViewBox, sunPath, sunViewBox } from '$lib/assets/svg-paths';
  import { Icon, themeManager, ThemePreference } from '@immich/ui';
  import { t } from 'svelte-i18n';
</script>

<div class="flex flex-col gap-4">
  <p>{$t('onboarding_theme_description')}</p>

  <div class="flex gap-4">
    <button
      type="button"
      class="aspect-square w-1/2 rounded-3xl border-[3px] border-immich-primary bg-light shadow-sm transition-all hover:shadow-xl dark:border dark:border-transparent dark:bg-dark"
      onclick={() => themeManager.setPreference(ThemePreference.Light)}
    >
      <div class="flex size-full flex-col place-content-center place-items-center justify-around text-immich-primary">
        <Icon icon={sunPath} viewBox={sunViewBox} size="96" />
        <p class="text-4xl font-semibold">{$t('light')}</p>
      </div>
    </button>
    <button
      type="button"
      class="aspect-square w-1/2 rounded-3xl border border-transparent bg-dark shadow-sm transition-all hover:shadow-xl dark:border-[3px] dark:border-immich-dark-primary dark:bg-light"
      onclick={() => themeManager.setPreference(ThemePreference.Dark)}
    >
      <div
        class="flex size-full flex-col place-content-center place-items-center justify-around text-immich-dark-primary"
      >
        <Icon icon={moonPath} viewBox={moonViewBox} size="96" />
        <p class="text-4xl font-semibold">{$t('dark')}</p>
      </div>
    </button>
  </div>
</div>
