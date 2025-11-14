<script lang="ts">
  import { handleAddExclusionPattern } from '$lib/services/library.service';
  import type { LibraryResponseDto } from '@immich/sdk';
  import { Button, HStack, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiFolderSync } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    library: LibraryResponseDto;
    onClose: () => void;
  };

  const { library, onClose }: Props = $props();
  let exclusionPattern = $state('');

  const onsubmit = async () => {
    const success = await handleAddExclusionPattern(library, exclusionPattern);

    if (success) {
      onClose();
    }
  };
</script>

<Modal title={$t('add_exclusion_pattern')} icon={mdiFolderSync} {onClose} size="small">
  <ModalBody>
    <form {onsubmit} autocomplete="off" id="library-exclusion-pattern-form">
      <p class="py-5 text-sm">{$t('admin.exclusion_pattern_description')}</p>

      <div class="my-4 flex flex-col gap-2">
        <label class="immich-form-label" for="path">{$t('path')}</label>
        <input class="immich-form-input" id="path" name="path" type="text" bind:value={exclusionPattern} />
      </div>
    </form>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button shape="round" color="secondary" fullWidth onclick={() => onClose()}>{$t('cancel')}</Button>
      <Button shape="round" type="submit" fullWidth form="library-exclusion-pattern-form">
        {$t('add')}
      </Button>
    </HStack>
  </ModalFooter>
</Modal>
