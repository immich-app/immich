<script lang="ts">
  import OnEvents from '$lib/components/OnEvents.svelte';
  import PurchaseActivationSuccess from '$lib/components/shared-components/purchasing/PurchaseActivationSuccess.svelte';
  import PurchaseContent from '$lib/components/shared-components/purchasing/PurchaseContent.svelte';

  import { Modal, ModalBody } from '@immich/ui';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  let showProductActivated = $state(false);
</script>

<OnEvents onLicenseActivated={() => (showProductActivated = true)} />

<Modal title=" " {onClose} size="large">
  <ModalBody>
    {#if showProductActivated}
      <PurchaseActivationSuccess onDone={onClose} />
    {:else}
      <PurchaseContent showMessage={false} />
    {/if}
  </ModalBody>
</Modal>
