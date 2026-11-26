<script lang="ts">
  import PinCodeResetModal from '#lib/modals/PinCodeResetModal.svelte';
  import { changePinCodeMutation } from '#lib/queries/auth.query.ts';
  import { Button, Field, Heading, PinInput, Text, modalManager } from '@immich/ui';
  import { createMutation } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';

  let currentPinCode = $state('');
  let newPinCode = $state('');
  let confirmPinCode = $state('');
  let canSubmit = $derived(currentPinCode.length === 6 && confirmPinCode.length === 6 && newPinCode === confirmPinCode);

  const changePinCode = createMutation(changePinCodeMutation);

  const handleSubmit = (event: Event) => {
    event.preventDefault();
    changePinCode.mutate([{ pinCodeChangeDto: { pinCode: currentPinCode, newPinCode } }], { onSuccess: resetForm });
  };

  const resetForm = () => {
    currentPinCode = '';
    newPinCode = '';
    confirmPinCode = '';
  };
</script>

<form autocomplete="off" onsubmit={handleSubmit}>
  <div class="flex flex-col place-content-center place-items-center gap-6">
    <Heading>{$t('change_pin_code')}</Heading>
    <Field label={$t('current_pin_code')}>
      <PinInput bind:value={currentPinCode} />
    </Field>
    <Field label={$t('new_pin_code')}>
      <PinInput bind:value={newPinCode} />
    </Field>
    <Field label={$t('confirm_new_pin_code')}>
      <PinInput bind:value={confirmPinCode} />
    </Field>
    <button type="button" onclick={() => modalManager.show(PinCodeResetModal, {})}>
      <Text color="muted" class="underline" size="small">{$t('forgot_pin_code_question')}</Text>
    </button>
  </div>

  <div class="mt-4 flex justify-end gap-2">
    <Button shape="round" color="secondary" type="button" size="small" onclick={resetForm}>
      {$t('clear')}
    </Button>
    <Button shape="round" type="submit" size="small" loading={changePinCode.isPending} disabled={!canSubmit}>
      {$t('save')}
    </Button>
  </div>
</form>
