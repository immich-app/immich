<script lang="ts">
  import { Button } from '@immich/ui';
  import { fade } from 'svelte/transition';
  const TOTP_SETUP_URL = 'https://login.pixelunion.eu/realms/pixelunion/account/';
  const openInNewTab = (baseUrl: string) => {
    // fallback without next param if anything unexpected happens
    globalThis.open(baseUrl, '_blank', 'noopener');
  };
</script>

<section class="my-4">
  <div class="flex flex-col gap-4" in:fade={{ duration: 500 }}>
    <div class="flex">
      <Button shape="round" size="small" onclick={() => openInNewTab(TOTP_SETUP_URL)}>Manage your account</Button>
    </div>
  </div>
</section>
