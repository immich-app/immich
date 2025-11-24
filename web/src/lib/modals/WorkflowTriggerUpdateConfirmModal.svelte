<script lang="ts">
  import { ConfirmModal } from '@immich/ui';
  import { mdiLightningBolt } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: (confirmed: boolean) => void;
  };

  let { onClose }: Props = $props();
</script>

<ConfirmModal
  confirmColor="primary"
  title={$t('change_trigger')}
  icon={mdiLightningBolt}
  prompt={$t('change_trigger_prompt')}
  onClose={(confirmed) => (confirmed ? onClose(true) : onClose(false))}
/>
