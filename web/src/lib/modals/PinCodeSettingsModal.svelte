<script lang="ts">
  import PinCodeChangeForm from '#lib/components/user-settings-page/PinCodeChangeForm.svelte';
  import PinCodeCreateForm from '#lib/components/user-settings-page/PinCodeCreateForm.svelte';
  import { getAuthStatusQuery } from '#lib/queries/auth.query.ts';
  import { createPreloadedQuery } from '#lib/queries/client.ts';
  import { BasicModal } from '@immich/ui';
  import { mdiLockReset } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: () => void;
  };

  const { onClose }: Props = $props();
  const status = createPreloadedQuery(getAuthStatusQuery);
</script>

<BasicModal size="small" title={$t('user_pin_code_settings')} icon={mdiLockReset} {onClose}>
  {#if status.data.pinCode}
    <PinCodeChangeForm />
  {:else}
    <PinCodeCreateForm />
  {/if}
</BasicModal>
