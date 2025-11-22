<script lang="ts">
  import { Button } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const PASSWORD_CHANGE_URL = 'https://login.pixelunion.eu/if/flow/default-password-change/';

  const openPasswordChange = () => {
    // Open in a new tab with noopener for security, adding redirect back
    try {
      const current = globalThis.location;
      const next = encodeURIComponent(current.origin + current.pathname + current.search + current.hash);
      const joinChar = PASSWORD_CHANGE_URL.includes('?') ? '&' : '?';
      const finalUrl = `${PASSWORD_CHANGE_URL}${joinChar}next=${next}`;
      globalThis.open(finalUrl, '_blank', 'noopener');
    } catch {
      globalThis.open(PASSWORD_CHANGE_URL, '_blank', 'noopener');
    }
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <div class="flex">
      <Button shape="round" size="small" onclick={openPasswordChange}>{$t('change_password')}</Button>
    </div>
  </div>
</section>
