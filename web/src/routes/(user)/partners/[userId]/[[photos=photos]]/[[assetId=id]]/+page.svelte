<script lang="ts">
  import { goto } from '$app/navigation';
  import ControlAppBar from '$lib/components/shared-components/ControlAppBar.svelte';
  import CreateSharedLink from '$lib/components/timeline/actions/CreateSharedLinkAction.svelte';
  import DownloadAction from '$lib/components/timeline/actions/DownloadAction.svelte';
  import AssetSelectControlBar from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import Timeline from '$lib/components/timeline/Timeline.svelte';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { Route } from '$lib/route';
  import { getAssetBulkActions } from '$lib/services/asset.service';
  import { handleError } from '$lib/utils/handle-error';
  import { AssetVisibility, updatePartner } from '@immich/sdk';
  import { ActionButton, CommandPaletteDefaultProvider, Field, Switch, Text } from '@immich/ui';
  import { mdiArrowLeft } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let inTimeline = $derived(data.inTimeline);

  const options = $derived({
    userId: data.partner.id,
    visibility: AssetVisibility.Timeline,
    withStacked: true,
  });

  const handleEscape = () => {
    if (!assetMultiSelectManager.selectionActive) {
      return;
    }

    assetMultiSelectManager.clear();
    return;
  };

  const handleToggleInTimeline = async (status: boolean) => {
    try {
      await updatePartner({ id: data.partner.id, partnerUpdateDto: { inTimeline: status } });
      inTimeline = status;
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_timeline_display_status'));
    }
  };
</script>

<main class="relative h-dvh overflow-hidden px-2 pt-(--navbar-height) max-md:pt-(--navbar-height-md) md:px-6">
  <Timeline enableRouting={true} {options} assetInteraction={assetMultiSelectManager} onEscape={handleEscape} />
</main>

{#if assetMultiSelectManager.selectionActive}
  <AssetSelectControlBar>
    {@const Actions = getAssetBulkActions($t)}
    <CommandPaletteDefaultProvider name={$t('assets')} actions={Object.values(Actions)} />
    <CreateSharedLink />
    <ActionButton action={Actions.AddToAlbum} />
    <DownloadAction />
  </AssetSelectControlBar>
{:else}
  <ControlAppBar backIcon={mdiArrowLeft} onClose={() => goto(Route.sharing())}>
    {#snippet leading()}
      <p class="whitespace-nowrap text-immich-fg dark:text-immich-dark-fg">
        {$t('partner_list_user_photos', { values: { user: data.partner.name } })}
      </p>
    {/snippet}
    {#snippet trailing()}
      <Field class="flex w-full place-content-center place-items-center gap-2">
        <Text size="small">
          {$t('show_in_timeline')}
        </Text>
        <Switch bind:checked={inTimeline} onCheckedChange={handleToggleInTimeline} />
      </Field>
    {/snippet}
  </ControlAppBar>
{/if}
