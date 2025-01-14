<script lang="ts">
  import ConfirmDialog from '../shared-components/dialog/confirm-dialog.svelte';
  import { showDeleteModal } from '$lib/stores/preferences.store';
  import Checkbox from '$lib/components/elements/checkbox.svelte';
  import { t } from 'svelte-i18n';
  import FormatMessage from '$lib/components/i18n/format-message.svelte';

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

<ConfirmDialog
  title={$t('permanently_delete_assets_count', { values: { count: size } })}
  confirmText={$t('delete')}
  onConfirm={handleConfirm}
  {onCancel}
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

    <div class="pt-4 flex justify-center items-center">
      <Checkbox id="confirm-deletion-input" label={$t('do_not_show_again')} bind:checked />
    </div>
  {/snippet}
</ConfirmDialog>
