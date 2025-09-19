<script lang="ts">
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { showDeleteModal } from '$lib/stores/preferences.store';
  import { Checkbox, ConfirmModal, Label } from '@immich/ui';
  import { mdiDeleteForeverOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    size: number;
    onConfirm: () => void;
    onCancel: () => void;
  }

  let { size, onConfirm, onCancel }: Props = $props();

  let checked = $state(false);

  const handleConfirm = () => {
    if (checked) {
      $showDeleteModal = false;
    }
    onConfirm();
  };
</script>

<ConfirmModal
  title={$t('permanently_delete_assets_count', { values: { count: size } })}
  confirmText={$t('delete')}
  icon={mdiDeleteForeverOutline}
  onClose={(confirmed) => (confirmed ? handleConfirm() : onCancel())}
>
  {#snippet promptSnippet()}
    <p>
      <FormatMessage key="permanently_delete_assets_prompt" values={{ count: size }}>
        {#snippet children({ message })}
          <b>{message}</b>
        {/snippet}
      </FormatMessage>
    </p>
    <p><b>{$t('cannot_undo_this_action')}</b></p>

    <div class="pt-4 flex justify-center items-center gap-2">
      <Checkbox id="confirm-deletion-input" bind:checked color="secondary" />
      <Label label={$t('do_not_show_again')} for="confirm-deletion-input" />
    </div>
  {/snippet}
</ConfirmModal>
