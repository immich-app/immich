<script lang="ts">
  import { executeMutation } from '$lib/queries/client';
  import { updateLibraryMutation } from '$lib/queries/library.query';
  import type { LibraryResponseDto } from '@immich/sdk';
  import { Field, FormModal, Input, Text } from '@immich/ui';
  import { mdiFolderSync } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    library: LibraryResponseDto;
    exclusionPattern: string;
    onClose: () => void;
  };

  const { library, exclusionPattern: oldValue, onClose }: Props = $props();
  let newValue = $state(oldValue);

  const onSubmit = async () => {
    const exclusionPatterns = library.exclusionPatterns.map((pattern) => (pattern === oldValue ? newValue : pattern));
    await executeMutation(updateLibraryMutation, [{ id: library.id, updateLibraryDto: { exclusionPatterns } }], {
      onSuccess: onClose,
    });
  };

  const disabled = $derived(!newValue || newValue === oldValue);
</script>

<FormModal title={$t('edit_exclusion_pattern')} icon={mdiFolderSync} {onClose} {onSubmit} size="small" {disabled}>
  <Text size="small" class="mb-4">{$t('admin.exclusion_pattern_description')}</Text>
  <Field label={$t('pattern')}>
    <Input bind:value={newValue} />
  </Field>
</FormModal>
