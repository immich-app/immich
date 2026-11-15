<script lang="ts">
  import { executeMutation } from '#lib/queries/client.ts';
  import { updateLibraryMutation } from '#lib/queries/library.query.ts';
  import type { LibraryResponseDto } from '@immich/sdk';
  import { Field, FormModal, HelperText, Input, Text } from '@immich/ui';
  import { mdiFolderSync } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    library: LibraryResponseDto;
    onClose: () => void;
  };

  const { library, onClose }: Props = $props();
  let value = $state('');
  const exists = $derived(library.exclusionPatterns.includes(value));

  const onSubmit = async () => {
    const exclusionPatterns = [...library.exclusionPatterns, value];
    await executeMutation(updateLibraryMutation, [{ id: library.id, updateLibraryDto: { exclusionPatterns } }], {
      onSuccess: onClose,
    });
  };
</script>

<FormModal
  title={$t('add_exclusion_pattern')}
  icon={mdiFolderSync}
  {onClose}
  {onSubmit}
  submitText={$t('add')}
  size="small"
  disabled={!value || exists}
>
  <Text size="small" class="mb-4">{$t('admin.exclusion_pattern_description')}</Text>
  <Field label={$t('pattern')}>
    <Input bind:value />
    {#if exists}
      <HelperText color="danger">{$t('errors.exclusion_pattern_already_exists')}</HelperText>
    {/if}
  </Field>
</FormModal>
