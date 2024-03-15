<script lang="ts">
  import logoDarkUrl from '$lib/assets/immich-logo-inline-dark.svg';
  import logoLightUrl from '$lib/assets/immich-logo-inline-light.svg';
  import logoNoText from '$lib/assets/immich-logo.svg';
  import { Theme } from '$lib/constants';
  import { colorTheme } from '$lib/stores/preferences.store';
  import type { HTMLImgAttributes } from 'svelte/elements';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface $$Props extends HTMLImgAttributes {
    noText?: boolean;
    draggable?: boolean;
  }

  export let noText = false;
  export let draggable = false;
</script>

<img
  src={noText ? logoNoText : $colorTheme.value == Theme.LIGHT ? logoLightUrl : logoDarkUrl}
  alt="Immich Logo"
  {draggable}
  {...$$restProps}
/>
