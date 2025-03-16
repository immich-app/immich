<script lang="ts">
  import { Theme } from '$lib/constants';
  import { colorTheme } from '$lib/stores/preferences.store';
  import { immichLogo, immichLogoInlineDark, immichLogoInlineLight, immichLogoJson } from '@immich/ui';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';
  import type { HTMLImgAttributes } from 'svelte/elements';

  interface Props extends HTMLImgAttributes {
    noText?: boolean;
    draggable?: boolean;
  }

  let { noText = false, draggable = false, ...rest }: Props = $props();

  const logoUrl = $derived(
    noText ? immichLogo : $colorTheme.value == Theme.LIGHT ? immichLogoInlineLight : immichLogoInlineDark,
  );

  const today = DateTime.now().toLocal();
</script>

{#if today.month === 4 && today.day === 1}
  <img src="data:image/png;base64, {immichLogoJson.content}" alt={$t('immich_logo')} class="h-14" {draggable} />
{:else}
  <img src={logoUrl} alt={$t('immich_logo')} {draggable} {...rest} />
{/if}
