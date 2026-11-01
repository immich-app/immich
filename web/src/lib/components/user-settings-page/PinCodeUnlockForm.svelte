<script lang="ts">
  import PinCodeCreateForm from '#lib/components/user-settings-page/PinCodeCreateForm.svelte';
  import { getAuthStatusQuery, unlockAuthSessionMutation } from '#lib/queries/auth.query.ts';
  import { createPreloadedQuery, executeMutation } from '#lib/queries/client.ts';
  import { PinInput } from '@immich/ui';
  import type { Snippet } from 'svelte';

  interface Props {
    onVerified: () => void;
    prompt: Snippet<[boolean, boolean]>;
    setup?: Snippet;
    footer?: Snippet<[boolean]>;
    showSetupLabel?: boolean;
  }

  let { onVerified, prompt, setup, footer, showSetupLabel = true }: Props = $props();
  const status = createPreloadedQuery(getAuthStatusQuery);
  const hasPinCode = $derived(status.data.pinCode);
  let pinCode = $state('');
  let isVerified = $state(false);
  let isBadPinCode = $state(false);

  const unlock = async (code: string) => {
    isBadPinCode = false;
    await executeMutation(unlockAuthSessionMutation, [{ sessionUnlockDto: { pinCode: code } }], {
      onSuccess: () => {
        isVerified = true;
        onVerified();
      },
      onError: () => (isBadPinCode = true),
    });
  };
</script>

{#if hasPinCode}
  {@render prompt(isVerified, isBadPinCode)}
  <PinInput password autofocus bind:value={pinCode} onComplete={unlock} />
{:else}
  {@render setup?.()}
  <PinCodeCreateForm showLabel={showSetupLabel} />
{/if}

{@render footer?.(hasPinCode)}
