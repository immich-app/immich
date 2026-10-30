<script lang="ts">
  import { executeMutation } from '#lib/queries/client.ts';
  import { updatePasskeyMutation } from '#lib/queries/passkey.query.ts';
  import { Field, FormModal, Input } from '@immich/ui';
  import { mdiShieldKeyOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    passkey: { id: string; name: string | null };
    onClose: () => void;
  };

  let { passkey, onClose }: Props = $props();

  let name = $state(passkey.name ?? '');

  const onSubmit = async () => {
    await executeMutation(updatePasskeyMutation, [{ id: passkey.id, passkeyUpdateDto: { name: name || null } }], {
      onSuccess: onClose,
    });
  };
</script>

<FormModal title={$t('passkeys', { values: { count: 1 } })} icon={mdiShieldKeyOutline} {onClose} {onSubmit}>
  <Field label={$t('name')}>
    <Input bind:value={name} />
  </Field>
</FormModal>
