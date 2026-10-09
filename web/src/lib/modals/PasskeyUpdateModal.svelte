<script lang="ts">
  import { handleUpdatePasskey } from '$lib/services/passkey.service';
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
    const success = await handleUpdatePasskey(passkey, { name });
    if (success) {
      onClose();
    }
  };
</script>

<FormModal title={$t('passkey')} icon={mdiShieldKeyOutline} {onClose} {onSubmit}>
  <Field label={$t('name')}>
    <Input bind:value={name} />
  </Field>
</FormModal>
