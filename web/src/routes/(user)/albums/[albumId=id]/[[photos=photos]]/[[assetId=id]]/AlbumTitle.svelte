<script lang="ts">
  import { shortcut } from '#lib/actions/shortcut.ts';
  import { updateAlbumInfoMutation } from '#lib/queries/album.query.ts';
  import { executeMutation } from '#lib/queries/client.ts';
  import { Textarea } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fromAction } from 'svelte/attachments';

  type Props = {
    id: string;
    albumName: string;
    isEditor: boolean;
  };

  let { id, albumName, isEditor }: Props = $props();

  let newAlbumName = $derived(albumName);

  const handleUpdate = async () => {
    newAlbumName = newAlbumName.replaceAll('\n', ' ').trim();

    if (newAlbumName === albumName) {
      return;
    }

    await executeMutation(
      () => updateAlbumInfoMutation({ error: { toast: 'errors.unable_to_save_album' } }),
      [{ id, updateAlbumDto: { albumName: newAlbumName } }],
    );
  };

  const textClasses = 'text-2xl lg:text-6xl text-primary';
</script>

<div class="mb-2">
  {#if isEditor}
    <Textarea
      bind:value={newAlbumName}
      variant="ghost"
      title={$t('edit_title')}
      onblur={handleUpdate}
      placeholder={$t('add_a_title')}
      class={textClasses}
      {@attach fromAction(shortcut, () => ({
        shortcut: { key: 'Enter' },
        onShortcut: (event) => event.currentTarget.blur(),
      }))}
    />
  {:else}
    <div class={textClasses}>{newAlbumName}</div>
  {/if}
</div>
