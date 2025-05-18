<script lang="ts">
  import ConfirmModal from '$lib/modals/ConfirmModal.svelte';
  import { Input } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: (description?: string) => void;
  }

  let { onClose }: Props = $props();

  let description = $state('');
</script>

<ConfirmModal
  confirmColor="primary"
  title={$t('edit_description')}
  prompt={$t('edit_description_prompt')}
  onClose={(confirmed) => (confirmed ? onClose(description) : onClose())}
>
  {#snippet promptSnippet()}
    <div class="flex flex-col text-start gap-2">
      <div class="flex flex-col">
        <label for="description">{$t('description')}</label>
        <Input class="immich-form-input" id="description" bind:value={description} />
      </div>
    </div>
  {/snippet}
</ConfirmModal>
