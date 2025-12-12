<script lang="ts">
  import { handleEditExclusionPattern } from '$lib/services/library.service';
  import type { LibraryResponseDto } from '@immich/sdk';
  import { Button, Field, HStack, Input, Modal, ModalBody, ModalFooter, Text } from '@immich/ui';
  import { mdiFolderSync } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    library: LibraryResponseDto;
    exclusionPattern: string;
    onClose: () => void;
  };

  const { library, exclusionPattern, onClose }: Props = $props();

  let newExclusionPattern = $state(exclusionPattern);

  const onsubmit = async () => {
    const success = await handleEditExclusionPattern(library, exclusionPattern, newExclusionPattern);
    if (success) {
      onClose();
    }
  };
</script>

<Modal title={$t('edit_exclusion_pattern')} icon={mdiFolderSync} {onClose} size="small">
  <ModalBody>
    <form {onsubmit} autocomplete="off" id="library-exclusion-pattern-form">
      <Text size="small" class="mb-4">{$t('admin.exclusion_pattern_description')}</Text>

      <Field label={$t('pattern')}>
        <Input bind:value={newExclusionPattern} />
      </Field>
    </form>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button shape="round" color="secondary" fullWidth onclick={() => onClose()}>{$t('cancel')}</Button>
      <Button shape="round" type="submit" fullWidth form="library-exclusion-pattern-form">
        {$t('save')}
      </Button>
    </HStack>
  </ModalFooter>
</Modal>
