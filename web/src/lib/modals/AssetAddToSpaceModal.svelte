<script lang="ts">
  import SpacePickerModal from '$lib/modals/SpacePickerModal.svelte';
  import { addAssetsToSpace } from '$lib/services/space.service';
  import type { SharedSpaceResponseDto } from '@immich/sdk';

  type Props = {
    assetIds: string[];
    onClose: () => void;
  };

  const { assetIds, onClose }: Props = $props();

  const handleClose = async (space?: SharedSpaceResponseDto) => {
    if (!space) {
      onClose();
      return;
    }

    const success = await addAssetsToSpace(space.id, assetIds, { notify: true });
    if (success) {
      onClose();
    }
  };
</script>

<SpacePickerModal onClose={handleClose} />
