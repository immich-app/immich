<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import FullScreenModal from './full-screen-modal.svelte';
  import { mdiInformationOutline } from '@mdi/js';
  import Icon from '../elements/icon.svelte';

  interface Shortcuts {
    general: ExplainedShortcut[];
    actions: ExplainedShortcut[];
  }

  interface ExplainedShortcut {
    key: string[];
    action: string;
    info?: string;
  }

  const shortcuts: Shortcuts = {
    general: [
      { key: ['←', '→'], action: 'Previous or next photo' },
      { key: ['Esc'], action: 'Back, close, or deselect' },
      { key: ['Ctrl', 'k'], action: 'Search your photos' },
      { key: ['Ctrl', '⇧', 'k'], action: 'Open the search filters' },
    ],
    actions: [
      { key: ['f'], action: 'Favorite or unfavorite photo' },
      { key: ['i'], action: 'Show or hide info' },
      { key: ['s'], action: 'Stack selected photos' },
      { key: ['⇧', 'a'], action: 'Archive or unarchive photo' },
      { key: ['⇧', 'd'], action: 'Download' },
      { key: ['Space'], action: 'Play or pause video' },
      { key: ['Del'], action: 'Trash/Delete Asset', info: 'press ⇧ to permanently delete asset' },
    ],
  };
  const dispatch = createEventDispatcher<{
    close: void;
  }>();
</script>

<FullScreenModal title="Keyboard shortcuts" width="auto" onClose={() => dispatch('close')}>
  <div class="grid grid-cols-1 gap-4 px-4 pb-4 md:grid-cols-2">
    <div class="p-4">
      <h2>General</h2>
      <div class="text-sm">
        {#each shortcuts.general as shortcut}
          <div class="grid grid-cols-[30%_70%] items-center gap-4 pt-4 text-sm">
            <div class="flex justify-self-end">
              {#each shortcut.key as key}
                <p class="mr-1 flex items-center justify-center justify-self-end rounded-lg bg-immich-primary/25 p-2">
                  {key}
                </p>
              {/each}
            </div>
            <p class="mb-1 mt-1 flex">{shortcut.action}</p>
          </div>
        {/each}
      </div>
    </div>

    <div class="p-4">
      <h2>Actions</h2>
      <div class="text-sm">
        {#each shortcuts.actions as shortcut}
          <div class="grid grid-cols-[30%_70%] items-center gap-4 pt-4 text-sm">
            <div class="flex justify-self-end">
              {#each shortcut.key as key}
                <p class="mr-1 flex items-center justify-center justify-self-end rounded-lg bg-immich-primary/25 p-2">
                  {key}
                </p>
              {/each}
            </div>
            <div class="flex items-center gap-2">
              <p class="mb-1 mt-1 flex">{shortcut.action}</p>
              {#if shortcut.info}
                <Icon path={mdiInformationOutline} title={shortcut.info} />
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</FullScreenModal>
