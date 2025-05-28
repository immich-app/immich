<script lang="ts">
  import { moonPath, moonViewBox, sunPath, sunViewBox } from '$lib/assets/svg-paths';
  import Icon from '$lib/components/elements/icon.svelte';
  import { Theme } from '$lib/constants';
  import { themeManager } from '$lib/managers/theme-manager.svelte';
  import { t } from 'svelte-i18n';

  export async function save() {}
</script>

<div>
  <div>
    <p class="pb-6 font-light">{$t('onboarding_theme_description')}</p>
  </div>

  <div class="flex gap-4 mb-6">
    <button
      type="button"
      class="w-1/2 aspect-square bg-light dark:bg-dark rounded-3xl transition-all shadow-sm hover:shadow-xl border-[3px] border-immich-primary dark:border dark:border-transparent"
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
      class="dark w-1/2 aspect-square bg-light rounded-3xl dark:border-[3px] dark:border-immich-dark-primary border border-transparent"
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
</div>
