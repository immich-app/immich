<script lang="ts">
  import AuthPageLayout from '#lib/components/layouts/AuthPageLayout.svelte';
  import { createAuthCodeMutation, logoutMutation } from '#lib/queries/auth.query.ts';
  import { MutationCancelledError } from '#lib/queries/client.ts';
  import { isPasskeyCancelled, loginWithPasskeyMutation } from '#lib/queries/passkey.query.ts';
  import { Button, Logo, Text } from '@immich/ui';
  import { startRegistration } from '@simplewebauthn/browser';
  import { createMutation } from '@tanstack/svelte-query';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  let callback = $state<string>();

  const passkeyLogin = createMutation(loginWithPasskeyMutation);
  const createAuthCode = createMutation(createAuthCodeMutation);
  const logout = createMutation(logoutMutation);

  onMount(async () => {
    const options = new URLSearchParams(location.hash.slice(1));
    const url = new URL('app.immich:///passkey-callback');
    try {
      const registration = options.get('registration');
      const codeChallenge = options.get('codeChallenge');
      if (registration) {
        const response = await startRegistration({ optionsJSON: JSON.parse(registration) });
        url.searchParams.set('credential', JSON.stringify(response));
      } else if (codeChallenge) {
        await passkeyLogin.mutateAsync();
        const { code } = await createAuthCode.mutateAsync([{ authCodeCreateDto: { codeChallenge } }]);
        await logout.mutateAsync([]);
        url.searchParams.set('code', code);
      }
    } catch (error) {
      if (!isPasskeyCancelled(error) && !(error instanceof MutationCancelledError)) {
        url.searchParams.set('error', String(error));
      }
    }

    callback = url.href;
    location.assign(callback);
  });
</script>

<AuthPageLayout withHeader={false}>
  <div class="flex flex-col items-center gap-4">
    <Logo variant="icon" size="giant" class={callback ? '' : 'animate-spin [animation-duration:8s]'} />
    <!-- Chrome Custom Tabs only open an app after a tap -->
    {#if callback}
      <Button href={callback} size="large" shape="round">{$t('continue')}</Button>
    {:else}
      <Text role="status">{$t('waiting_for_passkey')}</Text>
    {/if}
  </div>
</AuthPageLayout>
