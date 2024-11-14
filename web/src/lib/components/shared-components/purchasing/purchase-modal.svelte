<script lang="ts">
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import PurchaseActivationSuccess from '$lib/components/shared-components/purchasing/purchase-activation-success.svelte';
  import PurchaseContent from '$lib/components/shared-components/purchasing/purchase-content.svelte';

  import Portal from '$lib/components/shared-components/portal/portal.svelte';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  let showProductActivated = $state(false);
</script>

<Portal>
  <FullScreenModal showLogo title={''} {onClose} width="wide">
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
  </FullScreenModal>
</Portal>
