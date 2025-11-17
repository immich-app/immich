<script lang="ts">
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { resetPinCode } from '@immich/sdk';
  import {
    Button,
    Field,
    HelperText,
    HStack,
    Modal,
    ModalBody,
    ModalFooter,
    PasswordInput,
    Stack,
    Text,
    toastManager,
  } from '@immich/ui';
  import { mdiLockReset } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: (success?: true) => void;
  };

  let { onClose }: Props = $props();

  let passwordLoginEnabled = $derived(featureFlagsManager.value.passwordLogin);
  let password = $state('');

  const handleReset = async () => {
    try {
      await resetPinCode({ pinCodeResetDto: { password } });
      toastManager.success($t('pin_code_reset_successfully'));
      onClose(true);
    } catch (error) {
      handleError(error, $t('errors.failed_to_reset_pin_code'));
    }
  };

  const onsubmit = async (event: Event) => {
    event.preventDefault();
    await handleReset();
  };
</script>

<Modal title={$t('reset_pin_code')} icon={mdiLockReset} size="small" {onClose}>
  <ModalBody>
    <form {onsubmit} autocomplete="off" id="reset-pin-form">
      <Stack gap={4}>
        <div>{$t('reset_pin_code_description')}</div>
        {#if passwordLoginEnabled}
          <hr class="my-2 h-px w-full border-0 bg-gray-200 dark:bg-gray-600" />
          <section>
            <Field label={$t('confirm_password')} required>
              <PasswordInput bind:value={password} autocomplete="current-password" />
              <HelperText>
                <Text color="muted">{$t('reset_pin_code_with_password')}</Text>
              </HelperText>
            </Field>
          </section>
        {/if}
      </Stack>
    </form>
  </ModalBody>

  <ModalFooter>
    {#if passwordLoginEnabled}
      <HStack fullWidth>
        <Button fullWidth shape="round" color="secondary" onclick={() => onClose()}>{$t('cancel')}</Button>
        <Button type="submit" form="reset-pin-form" fullWidth shape="round" color="danger" disabled={!password}>
          {$t('reset')}
        </Button>
      </HStack>
    {:else}
      <Button shape="round" color="secondary" fullWidth onclick={() => onClose()}>{$t('close')}</Button>
    {/if}
  </ModalFooter>
</Modal>
