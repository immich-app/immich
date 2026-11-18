<script lang="ts">
  import { isPasskeyCancelled } from '#lib/queries/passkey.query.ts';
  import { Button } from '@immich/ui';
  import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  let callback = $state<string>();

  onMount(async () => {
    const options = new URLSearchParams(location.hash.slice(1));
    const url = new URL('app.immich:///passkey-callback');
    try {
      const registration = options.get('registration');
      const response = registration
        ? await startRegistration({ optionsJSON: JSON.parse(registration) })
        : await startAuthentication({ optionsJSON: JSON.parse(options.get('authentication') ?? '') });
      url.searchParams.set('credential', JSON.stringify(response));
    } catch (error) {
      if (!isPasskeyCancelled(error)) {
        url.searchParams.set('error', String(error));
      }
    }

    callback = url.href;
    location.assign(callback);
  });
</script>

<!-- Chrome Custom Tabs only open an app after a tap -->
{#if callback}
  <div class="flex h-dvh items-center justify-center">
    <Button href={callback} size="large" shape="round">{$t('continue')}</Button>
  </div>
{/if}
