<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { createEventDispatcher } from 'svelte';
  import { t } from 'svelte-i18n';
  import { mdiDeleteOutline, mdiDeleteForeverOutline } from '@mdi/js';
  import { type AssetResponseDto } from '@immich/sdk';

  export let asset: AssetResponseDto;

  type EventTypes = {
    delete: void;
    permanentlyDelete: void;
  };

  const dispatch = createEventDispatcher<EventTypes>();
</script>

{#if asset.isTrashed}
  <CircleIconButton
    color="opaque"
    icon={mdiDeleteForeverOutline}
    on:click={() => dispatch('permanentlyDelete')}
    title={$t('permanently_delete')}
  />
{:else}
  <CircleIconButton color="opaque" icon={mdiDeleteOutline} on:click={() => dispatch('delete')} title={$t('delete')} />
{/if}
