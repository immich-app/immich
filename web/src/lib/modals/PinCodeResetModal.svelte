<script lang="ts">
  import { handleResetPinCode } from '$lib/services/user.service';
  import { BasicModal, Field, FormModal, HelperText, PasswordInput, Stack, type ModalSize } from '@immich/ui';
  import { mdiLockReset } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { createPreloadedQuery } from '$lib/queries/client';
  import { getUserConfigQuery } from '$lib/queries/config-user.query';

  const query = createPreloadedQuery(getUserConfigQuery);
  const config = $derived(query.data);

  type Props = {
    onClose: (success?: true) => void;
  };

  let { onClose }: Props = $props();

  let password = $state('');

  const onSubmit = async () => {
    const success = await handleResetPinCode({ password });
    if (success) {
      onClose();
    }
  };

  const common = $derived({ title: $t('reset'), size: 'small' as ModalSize, icon: mdiLockReset, onClose });
</script>

{#if config.passwordLogin.enabled}
  <FormModal {...common} submitColor="danger" submitText={$t('reset')} disabled={!password} {onSubmit}>
    <Stack gap={4}>
      <div>{$t('reset_pin_code_description')}</div>
      <hr class="my-2 h-px w-full border-0 bg-gray-200 dark:bg-gray-600" />
      <section>
        <Field label={$t('confirm_password')} required>
          <PasswordInput bind:value={password} autocomplete="current-password" />
          <HelperText color="muted">{$t('reset_pin_code_with_password')}</HelperText>
        </Field>
      </section>
    </Stack>
  </FormModal>
{:else}
  <BasicModal {...common}>
    <div>{$t('reset_pin_code_description')}</div>
  </BasicModal>
{/if}
