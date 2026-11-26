<script lang="ts">
  import { updateAlbumInfoMutation } from '#lib/queries/album.query.ts';
  import { executeMutation } from '#lib/queries/client.ts';
  import { Draft } from '#lib/utils/draft.svelte.ts';
  import { Textarea, shortcut } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    id: string;
    description: string | null;
    isEditor: boolean;
  }

  let { id, description, isEditor }: Props = $props();

  const draft = new Draft(() => description ?? '');

  const handleFocusOut = () =>
    executeMutation(
      () => updateAlbumInfoMutation({ error: { toast: 'errors.unable_to_save_album' } }),
      [{ id, updateAlbumDto: { description: draft.value || null } }],
      { onSuccess: () => draft.reset() },
    );
</script>

{#if isEditor}
  <Textarea
    bind:value={draft.value}
    variant="ghost"
    onfocusout={handleFocusOut}
    placeholder={$t('add_a_description')}
    data-testid="autogrow-textarea"
    class="max-h-32"
    {@attach shortcut({
      shortcut: { key: 'Enter', ctrl: true },
      onShortcut: (e) => e.currentTarget.blur(),
    })}
  />
{:else if description}
  <p class="wrap-break-words w-full text-base whitespace-pre-line text-black dark:text-white">
    {description}
  </p>
{/if}
