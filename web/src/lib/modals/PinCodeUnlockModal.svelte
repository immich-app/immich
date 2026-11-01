<script lang="ts">
  import PinCodeUnlockForm from '#lib/components/user-settings-page/PinCodeUnlockForm.svelte';
  import { BasicModal } from '@immich/ui';
  import { mdiLockOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: (unlocked?: true) => void;
  }

  let { onClose }: Props = $props();
</script>

<BasicModal size="small" title={$t('unlock_private_content')} icon={mdiLockOutline} {onClose}>
  <PinCodeUnlockForm onVerified={() => onClose(true)}>
    {#snippet prompt()}
      <p class="mb-4">{$t('enter_your_pin_code')}</p>
    {/snippet}
  </PinCodeUnlockForm>
</BasicModal>
