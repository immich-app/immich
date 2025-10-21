<script lang="ts">
  import { ctrlKey } from '$lib/actions/input';
  import { shortcut } from '$lib/actions/shortcut.svelte';
  import { defaultLang, langs, Theme } from '$lib/constants';
  import { themeManager } from '$lib/managers/theme-manager.svelte';
  import { lang } from '$lib/stores/preferences.store';
  import { ThemeSwitcher } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { get } from 'svelte/store';

  const handleToggleTheme = () => {
    if (themeManager.theme.system) {
      return;
    }

    themeManager.toggleTheme();
  };
</script>

<svelte:window {@attach shortcut(ctrlKey('t'), $t('dark_theme'), handleToggleTheme)} />

{#if !themeManager.theme.system}
  {#await langs
    .find((item) => item.code === get(lang))
    ?.loader() ?? defaultLang.loader() then { default: translations }}
    <ThemeSwitcher
      size="medium"
      color="secondary"
      {translations}
      onChange={(theme) => themeManager.setTheme(theme == 'dark' ? Theme.DARK : Theme.LIGHT)}
    />
  {/await}
{/if}
