<script lang="ts">
  import QRCode from 'qrcode';
  import { t } from 'svelte-i18n';

  type Props = {
    value: string;
    width: number;
    alt?: string;
  };

  const { value, width, alt = $t('alt_text_qr_code') }: Props = $props();

  let promise = $derived(QRCode.toDataURL(value, { margin: 0, width }));
</script>

<div style="width: {width}px; height: {width}px">
  {#await promise then url}
    <img src={url} {alt} class="h-full w-full" />
  {/await}
</div>
