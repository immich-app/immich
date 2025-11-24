<script lang="ts">
  import { ConfirmModal } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: (confirmed: boolean) => void;
  };

  let { onClose }: Props = $props();
</script>

<ConfirmModal
  confirmColor="primary"
  prompt={$t('workflow_navigation_prompt')}
  onClose={(confirmed) => (confirmed ? onClose(true) : onClose(false))}
/>
