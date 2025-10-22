<script lang="ts">
  import { ConfirmModal, Field, Textarea } from '@immich/ui';
  import { mdiText } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: (description?: string) => void;
  };

  let { onClose }: Props = $props();
  let description = $state('');
</script>

<ConfirmModal
  confirmColor="primary"
  title={$t('edit_description')}
  icon={mdiText}
  prompt={$t('edit_description_prompt')}
  onClose={(confirmed) => (confirmed ? onClose(description) : onClose())}
>
  {#snippet promptSnippet()}
    <Field label={$t('description')}>
      <Textarea bind:value={description} grow />
    </Field>
  {/snippet}
</ConfirmModal>
