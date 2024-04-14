<script lang="ts">
  import logoDarkUrl from '$lib/assets/immich-logo-inline-dark.svg';
  import logoLightUrl from '$lib/assets/immich-logo-inline-light.svg';
  import logoNoText from '$lib/assets/immich-logo.svg';
  import { content as alternativeLogo } from '$lib/assets/immich-logo.json';
  import { Theme } from '$lib/constants';
  import { colorTheme } from '$lib/stores/preferences.store';
  import { DateTime } from 'luxon';
  import type { HTMLImgAttributes } from 'svelte/elements';

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
  <img src="data:image/png;base64, {alternativeLogo}" alt="Immich Logo" class="max-h-[60px]" {draggable} />
{:else}
  <img
    src={noText ? logoNoText : $colorTheme.value === Theme.LIGHT ? logoLightUrl : logoDarkUrl}
    alt="Immich Logo"
    {draggable}
    {...$$restProps}
  />
{/if}
