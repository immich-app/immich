<script lang="ts">
  import { setupPinCodeMutation } from '#lib/queries/auth.query.ts';
  import { Button, Field, Heading, PinInput } from '@immich/ui';
  import { createMutation } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';

  interface Props {
    showLabel?: boolean;
  }

  let { showLabel = true }: Props = $props();

  let newPinCode = $state('');
  let confirmPinCode = $state('');
  let canSubmit = $derived(confirmPinCode.length === 6 && newPinCode === confirmPinCode);

  const setupPinCode = createMutation(setupPinCodeMutation);

  const handleSubmit = (event: Event) => {
    event.preventDefault();
    setupPinCode.mutate([{ pinCodeSetupDto: { pinCode: newPinCode } }], { onSuccess: resetForm });
  };

  const resetForm = () => {
    newPinCode = '';
    confirmPinCode = '';
  };
</script>

<form autocomplete="off" onsubmit={handleSubmit}>
  <div class="flex flex-col place-content-center place-items-center gap-6">
    {#if showLabel}
      <Heading>{$t('setup_pin_code')}</Heading>
    {/if}
    <Field label={$t('new_pin_code')}>
      <PinInput bind:value={newPinCode} />
    </Field>
    <Field label={$t('confirm_new_pin_code')}>
      <PinInput bind:value={confirmPinCode} />
    </Field>
  </div>

  <div class="mt-4 flex justify-end gap-2">
    <Button shape="round" color="secondary" type="button" size="small" onclick={resetForm}>
      {$t('clear')}
    </Button>
    <Button shape="round" type="submit" size="small" loading={setupPinCode.isPending} disabled={!canSubmit}>
      {$t('create')}
    </Button>
  </div>
</form>
