<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import CreateSharedLinkModal from '$lib/components/shared-components/create-share-link-modal/create-shared-link-modal.svelte';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import type { AssetResponseDto } from '@immich/sdk';
  import { mdiShareVariantOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
  }

  let { asset }: Props = $props();

  let showModal = $state(false);
</script>

<CircleIconButton color="opaque" icon={mdiShareVariantOutline} onclick={() => (showModal = true)} title={$t('share')} />

{#if showModal}
  <Portal target="body">
    <CreateSharedLinkModal assetIds={[asset.id]} onClose={() => (showModal = false)} />
  </Portal>
{/if}
