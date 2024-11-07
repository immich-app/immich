<script lang="ts">
  import logoDarkUrl from '$lib/assets/immich-logo-inline-dark.svg';
  import logoLightUrl from '$lib/assets/immich-logo-inline-light.svg';
  import logoNoText from '$lib/assets/immich-logo.svg';
  import { content as alternativeLogo } from '$lib/assets/immich-logo.json';
  import { Theme } from '$lib/constants';
  import { colorTheme } from '$lib/stores/preferences.store';
  import { DateTime } from 'luxon';
  import type { HTMLImgAttributes } from 'svelte/elements';
  import { t } from 'svelte-i18n';

  interface Props extends HTMLImgAttributes {
    noText?: boolean;
    draggable?: boolean;
  }

  let { noText = false, draggable = false, ...rest }: Props = $props();

  const today = DateTime.now().toLocal();
</script>

{#if today.month === 4 && today.day === 1}
  <img src="data:image/png;base64, {alternativeLogo}" alt={$t('immich_logo')} class="h-20" {draggable} />
{:else}
  <img
    src={noText ? logoNoText : $colorTheme.value == Theme.LIGHT ? logoLightUrl : logoDarkUrl}
    alt={$t('immich_logo')}
    {draggable}
    {...rest}
  />
{/if}
