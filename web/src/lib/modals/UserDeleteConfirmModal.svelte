<script lang="ts">
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
  import { handleDeleteUserAdmin } from '$lib/services/user-admin.service';
  import { type UserAdminResponseDto } from '@immich/sdk';
  import { Alert, Checkbox, ConfirmModal, Field, Input, Label, Text } from '@immich/ui';
  import { mdiTrashCanOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    user: UserAdminResponseDto;
    onClose: () => void;
  };

  let { user, onClose }: Props = $props();

  let force = $state(false);
  let email = $state('');
  let disabled = $derived(force && email !== user.email);

  const handleClose = async (confirmed?: boolean) => {
    if (!confirmed) {
      onClose();
      return;
    }

    const success = await handleDeleteUserAdmin(user, { force });
    if (success) {
      onClose();
    }
  };
</script>

<ConfirmModal
  icon={mdiTrashCanOutline}
  title={$t('delete_user')}
  confirmText={force ? $t('permanently_delete') : $t('delete')}
  onClose={handleClose}
  {disabled}
>
  {#snippet prompt()}
    <div class="flex flex-col gap-4">
      <Text>
        {#if force}
          <FormatMessage key="admin.user_delete_immediately" values={{ user: user.name }}>
            {#snippet children({ message })}
              <b>{message}</b>
            {/snippet}
          </FormatMessage>
        {:else}
          <FormatMessage
            key="admin.user_delete_delay"
            values={{ user: user.name, delay: serverConfigManager.value.userDeleteDelay }}
          >
            {#snippet children({ message })}
              <b>{message}</b>
            {/snippet}
          </FormatMessage>
        {/if}
      </Text>

      <div class="flex items-center gap-2">
        <Checkbox id="queue-user-deletion-checkbox" color="secondary" bind:checked={force} />
        <Label label={$t('admin.user_delete_immediately_checkbox')} for="queue-user-deletion-checkbox" />
      </div>

      {#if force}
        <Alert color="danger" icon={false}>{$t('admin.force_delete_user_warning')}</Alert>

        <Field label={$t('admin.confirm_email_below', { values: { email: user.email } })}>
          <Input bind:value={email} />
        </Field>
      {/if}
    </div>
  {/snippet}
</ConfirmModal>
