<script lang="ts">
  import { Theme } from '$lib/constants';
  import { colorTheme } from '$lib/stores/preferences.store';
  import { ThemeSwitcher, Theme as ImmichTheme } from '@immich/ui';

  const onThemeToggle = (theme: ImmichTheme) => {
    $colorTheme.value = theme === ImmichTheme.Light ? Theme.LIGHT : Theme.DARK;
  };
</script>

{#if !$colorTheme.system}
  <ThemeSwitcher onChange={onThemeToggle} size="large" color="secondary" />
{/if}
