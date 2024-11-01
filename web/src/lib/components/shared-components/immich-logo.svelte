<script lang="ts">
  import logoDarkUrl from '$lib/assets/immich-logo-inline-dark.svg';
  import logoLightUrl from '$lib/assets/immich-logo-inline-light.svg';
  import logoNoTextLight from '$lib/assets/immich-logo-light.svg';
  import logoNoTextDark from '$lib/assets/immich-logo-dark.svg';
  import { content as alternativeLogo } from '$lib/assets/immich-logo.json';
  import { Theme } from '$lib/constants';
  import { colorTheme } from '$lib/stores/preferences.store';
  import { DateTime } from 'luxon';
  import type { HTMLImgAttributes } from 'svelte/elements';
  import { t } from 'svelte-i18n';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface $$Props extends HTMLImgAttributes {
    noText?: boolean;
    draggable?: boolean;
  }

  export let noText = false;
  export let draggable = false;

  const today = DateTime.now().toLocal();
</script>

{#if today.month === 4 && today.day === 1}
  <img src="data:image/png;base64, {alternativeLogo}" alt={$t('immich_logo')} class="h-20" {draggable} />
{:else}
  <img
    src={noText
      ? $colorTheme.value == Theme.LIGHT
        ? logoNoTextLight
        : logoNoTextDark
      : $colorTheme.value == Theme.LIGHT
        ? logoLightUrl
        : logoDarkUrl}
    alt={$t('immich_logo')}
    {draggable}
    {...$$restProps}
  />
{/if}
