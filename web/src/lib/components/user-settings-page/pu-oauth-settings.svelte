<script lang="ts">
  import { Button } from '@immich/ui';
  import { fade } from 'svelte/transition';

  const TOTP_SETUP_URL = 'https://login.pixelunion.eu/if/flow/default-authenticator-totp-setup/';
  const WEBAUTHN_SETUP_URL = 'https://login.pixelunion.eu/if/flow/default-authenticator-webauthn-setup/';

  const openInNewTab = (baseUrl: string) => {
    try {
      const current = globalThis.location;
      const next = encodeURIComponent(current.origin + current.pathname + current.search + current.hash);
      const joinChar = baseUrl.includes('?') ? '&' : '?';
      const finalUrl = `${baseUrl}${joinChar}next=${next}`;
      globalThis.open(finalUrl, '_blank', 'noopener');
    } catch {
      // fallback without next param if anything unexpected happens
      globalThis.open(baseUrl, '_blank', 'noopener');
    }
  };
</script>

<section class="my-4">
  <div class="flex flex-col gap-4" in:fade={{ duration: 500 }}>
    <div class="flex">
      <Button shape="round" size="small" onclick={() => openInNewTab(TOTP_SETUP_URL)}>
        Set up authenticator app (TOTP)
      </Button>
    </div>
    <div class="flex">
      <Button shape="round" size="small" onclick={() => openInNewTab(WEBAUTHN_SETUP_URL)}>
        Set up passkey (WebAuthn)
      </Button>
    </div>
  </div>
</section>
