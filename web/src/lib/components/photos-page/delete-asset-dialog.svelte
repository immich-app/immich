<script lang="ts">
  import ConfirmDialog from '../shared-components/dialog/confirm-dialog.svelte';
  import { showDeleteModal } from '$lib/stores/preferences.store';
  import Checkbox from '$lib/components/elements/checkbox.svelte';
  import { t } from 'svelte-i18n';
  import FormatMessage from '$lib/components/i18n/format-message.svelte';

  export let size: number;
  export let onConfirm: () => void;
  export let onCancel: () => void;

  let checked = false;

  const handleConfirm = () => {
    if (checked) {
      $showDeleteModal = false;
    }
    onConfirm();
  };
</script>

<ConfirmDialog
  title={$t('permanently_delete_assets_count', { values: { count: size } })}
  confirmText={$t('delete')}
  onConfirm={handleConfirm}
  {onCancel}
>
  <svelte:fragment slot="prompt">
    <p>
      <FormatMessage key="permanently_delete_assets_prompt" values={{ count: size }} let:message>
        <b>{message}</b>
      </FormatMessage>
    </p>
    <p><b>{$t('cannot_undo_this_action')}</b></p>

    <div class="pt-4 flex justify-center items-center">
      <Checkbox id="confirm-deletion-input" label={$t('do_not_show_again')} bind:checked />
    </div>
  </svelte:fragment>
</ConfirmDialog>
