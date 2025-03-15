<script lang="ts">
  import QRCode from 'qrcode';
  import { colorTheme } from '$lib/stores/preferences.store';
  import { Theme } from '$lib/constants';
  import { t } from 'svelte-i18n';

  type Props = {
    value: string;
    width: number;
    alt?: string;
  };

  const { value, width, alt = $t('alt_text_qr_code') }: Props = $props();

  let promise = $derived(
    QRCode.toDataURL(value, {
      color: { dark: $colorTheme.value === Theme.DARK ? '#ffffffff' : '#000000ff', light: '#00000000' },
      margin: 0,
      width,
    }),
  );
</script>

<div style="width: {width}px; height: {width}px">
  {#await promise then url}
    <img src={url} {alt} class="h-full w-full" />
  {/await}
</div>
