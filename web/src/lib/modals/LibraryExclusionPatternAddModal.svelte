<script lang="ts">
  import { handleAddLibraryExclusionPattern } from '$lib/services/library.service';
  import type { LibraryResponseDto } from '@immich/sdk';
  import { Field, FormModal, Input, Text } from '@immich/ui';
  import { mdiFolderSync } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    library: LibraryResponseDto;
    onClose: () => void;
  };

  const { library, onClose }: Props = $props();
  let value = $state('');

  const onSubmit = async () => {
    const success = await handleAddLibraryExclusionPattern(library, value);
    if (success) {
      onClose();
    }
  };
</script>

<FormModal
  title={$t('add_exclusion_pattern')}
  icon={mdiFolderSync}
  {onClose}
  {onSubmit}
  submitText={$t('add')}
  size="small"
>
  <Text size="small" class="mb-4">{$t('admin.exclusion_pattern_description')}</Text>
  <Field label={$t('pattern')}>
    <Input bind:value />
  </Field>
</FormModal>
