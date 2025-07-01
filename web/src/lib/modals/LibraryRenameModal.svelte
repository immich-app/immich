<script lang="ts">
  import type { LibraryResponseDto } from '@immich/sdk';
  import { Button, Field, HStack, Input, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiRenameOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    library: Partial<LibraryResponseDto>;
    onClose: (library?: Partial<LibraryResponseDto>) => void;
  }

  let { library, onClose }: Props = $props();

  let newName = $state(library.name);

  const onsubmit = (event: Event) => {
    event.preventDefault();
    onClose({ ...library, name: newName });
  };
</script>

<Modal icon={mdiRenameOutline} title={$t('rename')} {onClose} size="small">
  <ModalBody>
    <form {onsubmit} autocomplete="off" id="rename-library-form">
      <Field label={$t('name')}>
        <Input bind:value={newName} />
      </Field>
    </form>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button shape="round" fullWidth color="secondary" onclick={() => onClose()}>{$t('cancel')}</Button>
      <Button shape="round" fullWidth type="submit" form="rename-library-form">{$t('save')}</Button>
    </HStack>
  </ModalFooter>
</Modal>
