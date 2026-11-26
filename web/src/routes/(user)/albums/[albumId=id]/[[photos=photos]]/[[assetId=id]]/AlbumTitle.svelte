<script lang="ts">
  import { updateAlbumInfoMutation } from '#lib/queries/album.query.ts';
  import { executeMutation } from '#lib/queries/client.ts';
  import { Draft } from '#lib/utils/draft.svelte.ts';
  import { Textarea, shortcut } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    id: string;
    albumName: string;
    isEditor: boolean;
  };

  let { id, albumName, isEditor }: Props = $props();

  const newAlbumName = new Draft(() => albumName);

  const handleUpdate = async () => {
    newAlbumName.value = newAlbumName.value.replaceAll('\n', ' ').trim();

    if (newAlbumName.value === albumName) {
      newAlbumName.reset();
      return;
    }

    await executeMutation(
      () => updateAlbumInfoMutation({ error: { toast: 'errors.unable_to_save_album' } }),
      [{ id, updateAlbumDto: { albumName: newAlbumName.value } }],
      { onSuccess: () => newAlbumName.reset() },
    );
  };

  const textClasses = 'text-2xl lg:text-6xl text-primary';
</script>

<div class="mb-2">
  {#if isEditor}
    <Textarea
      bind:value={newAlbumName.value}
      variant="ghost"
      title={$t('edit_title')}
      onblur={handleUpdate}
      placeholder={$t('add_a_title')}
      class={textClasses}
      {@attach shortcut({
        shortcut: { key: 'Enter' },
        onShortcut: (event) => event.currentTarget.blur(),
      })}
    />
  {:else}
    <div class={textClasses}>{newAlbumName.value}</div>
  {/if}
</div>
