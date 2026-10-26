<script lang="ts">
  import { shortcut } from '#lib/actions/shortcut.ts';
  import { updateAlbumInfoMutation } from '#lib/queries/album.query.ts';
  import { executeMutation } from '#lib/queries/client.ts';
  import { Textarea } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fromAction } from 'svelte/attachments';

  interface Props {
    id: string;
    description: string;
    isEditor: boolean;
  }

  let { id, description, isEditor }: Props = $props();

  let value = $derived(description);

  const handleFocusOut = () =>
    executeMutation(
      () => updateAlbumInfoMutation({ error: { toast: 'errors.unable_to_save_album' } }),
      [{ id, updateAlbumDto: { description: value || null } }],
    );
</script>

{#if isEditor}
  <Textarea
    bind:value
    variant="ghost"
    onfocusout={handleFocusOut}
    placeholder={$t('add_a_description')}
    data-testid="autogrow-textarea"
    class="max-h-32"
    {@attach fromAction(shortcut, () => ({
      shortcut: { key: 'Enter', ctrl: true },
      onShortcut: (e) => e.currentTarget.blur(),
    }))}
  />
{:else if description}
  <p class="wrap-break-words w-full text-base whitespace-pre-line text-black dark:text-white">
    {description}
  </p>
{/if}
