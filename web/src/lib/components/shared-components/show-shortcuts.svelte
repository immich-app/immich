<script lang="ts">
  import Close from 'svelte-material-icons/Close.svelte';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import { createEventDispatcher } from 'svelte';
  import FullScreenModal from './full-screen-modal.svelte';

  const shortcuts = {
    general: [
      { key: ['←', '→'], action: 'Previous or next photo' },
      { key: ['Esc'], action: 'Back, close, or deselect' },
      { key: ['/'], action: 'Search your photos' },
    ],
    actions: [
      { key: ['f'], action: 'Favorite or unfavorite photo' },
      { key: ['i'], action: 'Show or hide info' },
      { key: ['⇧', 'a'], action: 'Archive or unarchive photo' },
      { key: ['⇧', 'd'], action: 'Download' },
      { key: ['Space'], action: 'Play or pause video' },
      { key: ['Del'], action: 'Delete Asset' },
    ],
  };
  const dispatch = createEventDispatcher();
</script>

<FullScreenModal on:clickOutside={() => dispatch('close')}>
  <div class="flex h-full w-full place-content-center place-items-center overflow-hidden">
    <div
      class="w-[400px] max-w-[125vw] rounded-3xl border bg-immich-bg shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg md:w-[650px]"
    >
      <div class="relative px-4 pt-4">
        <h1 class="px-4 py-4 font-medium text-immich-primary dark:text-immich-dark-primary">Keyboard Shortcuts</h1>
        <div class="absolute inset-y-0 right-0 px-4 py-4">
          <CircleIconButton logo={Close} on:click={() => dispatch('close')} />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 px-4 pb-4 md:grid-cols-2">
        <div class="px-4 py-4">
          <h2>General</h2>
          <div class="text-sm">
            {#each shortcuts.general as shortcut}
              <div class="grid grid-cols-[20%_80%] items-center gap-4 pt-4 text-sm">
                <div class="flex justify-self-end">
                  {#each shortcut.key as key}
                    <p
                      class="mr-1 flex items-center justify-center justify-self-end rounded-lg bg-immich-primary/25 p-2"
                    >
                      {key}
                    </p>
                  {/each}
                </div>
                <p class="mb-1 mt-1 flex">{shortcut.action}</p>
              </div>
            {/each}
          </div>
        </div>

        <div class="px-4 py-4">
          <h2>Actions</h2>
          <div class="text-sm">
            {#each shortcuts.actions as shortcut}
              <div class="grid grid-cols-[20%_80%] items-center gap-4 pt-4 text-sm">
                <div class="flex justify-self-end">
                  {#each shortcut.key as key}
                    <p
                      class="mr-1 flex items-center justify-center justify-self-end rounded-lg bg-immich-primary/25 p-2"
                    >
                      {key}
                    </p>
                  {/each}
                </div>
                <p class="mb-1 mt-1 flex">{shortcut.action}</p>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</FullScreenModal>
