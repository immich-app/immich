<script lang="ts">
  import SpaceLinkedLibraries from '$lib/components/spaces/space-linked-libraries.svelte';
  import { getSpace, type SharedSpaceResponseDto } from '@immich/sdk';
  import { Modal, ModalBody } from '@immich/ui';
  import { mdiBookshelf } from '@mdi/js';

  interface Props {
    space: SharedSpaceResponseDto;
    onClose: (changed?: boolean) => void;
  }

  let { space: initialSpace, onClose }: Props = $props();

  let spaceData = $state(initialSpace);
  let changed = $state(false);

  const handleChanged = async () => {
    changed = true;
    try {
      spaceData = await getSpace({ id: spaceData.id });
    } catch {
      // Link/unlink already succeeded; caller will refresh on close via changed flag
    }
  };
</script>

<Modal title="Connected Libraries" icon={mdiBookshelf} onClose={() => onClose(changed)}>
  <ModalBody>
    <SpaceLinkedLibraries space={spaceData} onChanged={handleChanged} />
  </ModalBody>
</Modal>
