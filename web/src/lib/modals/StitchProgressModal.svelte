<script lang="ts">
  import { LoadingSpinner, Modal, ModalBody } from '@immich/ui';
  import { mdiImageMultipleOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    count: number;
    task: Promise<boolean>;
    onClose: (success: boolean) => void;
  }

  let { count, task, onClose }: Props = $props();

  // close (and resolve modalManager.show) as soon as the work settles
  task.then(
    () => onClose(true),
    () => onClose(false),
  );
</script>

<Modal title={$t('stitch_progress_title')} icon={mdiImageMultipleOutline} {onClose} size="small">
  <ModalBody>
    <div class="flex items-center gap-4 py-4">
      <LoadingSpinner />
      <p class="text-sm">{$t('stitch_progress_description', { values: { count } })}</p>
    </div>
  </ModalBody>
</Modal>
