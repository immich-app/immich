<script lang="ts">
  import PurchaseActivationSuccess from '$lib/components/shared-components/purchasing/purchase-activation-success.svelte';
  import PurchaseContent from '$lib/components/shared-components/purchasing/purchase-content.svelte';

  import { Modal, ModalBody } from '@immich/ui';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  let showProductActivated = $state(false);
</script>

<Modal title="" {onClose} size="large">
  <ModalBody>
    {#if showProductActivated}
      <PurchaseActivationSuccess onDone={onClose} />
    {:else}
      <PurchaseContent
        onActivate={() => {
          showProductActivated = true;
        }}
        showMessage={false}
      />
    {/if}
  </ModalBody>
</Modal>
