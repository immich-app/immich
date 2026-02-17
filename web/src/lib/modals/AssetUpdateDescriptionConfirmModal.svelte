<script lang="ts">
  import { Field, FormModal, Textarea } from '@immich/ui';
  import { mdiText } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: (description?: string) => void;
  };

  let { onClose }: Props = $props();
  let description = $state('');
</script>

<FormModal title={$t('edit_description')} icon={mdiText} {onClose} onSubmit={() => onClose(description)}>
  <Field label={$t('description')}>
    <Textarea bind:value={description} grow />
  </Field>
</FormModal>
