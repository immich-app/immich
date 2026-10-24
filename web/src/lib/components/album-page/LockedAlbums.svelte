<script lang="ts">
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { LockedAlbumsManager } from '$lib/managers/locked-albums-manager.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { Button, Field, Input, Select } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import LockedGallery from './LockedGallery.svelte';

  let { deadline }: { deadline: number } = $props();

  const manager = new LockedAlbumsManager((error) => handleError(error, $t('errors.something_went_wrong')));
  let name = $state('');
  let confirmDelete = $state(false);
  const selectedIds = $derived(assetMultiSelectManager.assets.map((asset) => asset.id));
  const canUpdate = $derived(selectedIds.length > 0 && selectedIds.length <= 100 && !!manager.selectedId);
  const options = $derived([
    { label: 'Choose a private group', value: '' },
    ...manager.albums.map((album) => ({ label: `${album.albumName} (${album.assetCount})`, value: album.id })),
  ]);

  onMount(() => {
    manager.mount(() => {
      name = '';
      confirmDelete = false;
    }, deadline);
    return () => {
      manager.destroy();
      name = '';
      confirmDelete = false;
    };
  });

  const select = (id: string) => {
    if (manager.busy) {
      return;
    }
    name = manager.albums.find((album) => album.id === id)?.albumName ?? '';
    confirmDelete = false;
    void manager.select(id);
  };
</script>

<!-- Experimental fallback strings deliberately stay out of generated translations. -->
{#if !manager.locked}
  <section aria-label="Private groups (experimental)" class="m-4 rounded-lg border p-4">
    <h2 class="mb-2 text-lg font-semibold">Private groups (experimental)</h2>
    <p class="mb-4 text-sm">Owner-only groups inside the locked folder. Deleting a group does not delete photos.</p>
    <div class="flex flex-wrap items-end gap-3">
      <Field label="Private group" disabled={manager.busy}>
        <Select value={manager.selectedId} {options} onChange={select} />
      </Field>
      <Field label="Group name" disabled={manager.busy}>
        <Input bind:value={name} maxlength={255} autocomplete="off" />
      </Field>
      <Button disabled={manager.busy || !name.trim()} onclick={() => manager.create(name)}>Create group</Button>
      <Button variant="ghost" disabled={manager.busy} onclick={() => manager.refresh()}>Refresh groups</Button>
      <Button
        variant="outline"
        disabled={manager.busy || !manager.selectedId || !name.trim()}
        onclick={() => manager.rename(name)}>Rename</Button
      >
      <Button variant="outline" disabled={manager.busy || !manager.selectedId} onclick={() => (confirmDelete = true)}
        >Delete group</Button
      >
    </div>

    {#if confirmDelete && manager.selectedId}
      <div class="mt-4 flex flex-wrap items-center gap-3">
        <p>Delete this grouping only? Photos remain locked.</p>
        <Button
          color="danger"
          disabled={manager.busy}
          onclick={() => {
            confirmDelete = false;
            void manager.delete();
          }}>Confirm delete</Button
        >
        <Button variant="ghost" onclick={() => (confirmDelete = false)}>Cancel</Button>
      </div>
    {/if}

    {#if manager.selectedId}
      <div class="mt-4 flex flex-wrap items-center gap-3">
        <p class="text-sm">Select 1–100 photos in the original locked timeline below to add them to this group.</p>
        <Button disabled={manager.busy || !canUpdate} onclick={() => manager.updateAssets(selectedIds, true)}
          >Add selected ({selectedIds.length})</Button
        >
        <Button
          variant="outline"
          disabled={manager.busy || !canUpdate}
          onclick={() => manager.updateAssets(selectedIds, false)}>Remove selected</Button
        >
      </div>
      <h3 class="mt-4 font-semibold">Group photos</h3>
      <p class="text-sm">The timeline below still shows all locked photos, not just this group.</p>
      {#key manager.selectedId}
        <LockedGallery
          ids={manager.assetIds}
          {deadline}
          busy={manager.busy}
          onRemove={(ids) => manager.updateAssets(ids, false)}
        />
      {/key}
      {#if manager.hasNextPage}
        <Button variant="ghost" disabled={manager.busy} onclick={() => manager.more()}>Load more members</Button>
      {/if}
    {/if}
    <p role="status" class="mt-2 text-sm">{manager.busy ? 'Loading…' : ''}</p>
  </section>
{/if}
