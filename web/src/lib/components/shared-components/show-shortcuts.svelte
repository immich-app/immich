<script lang="ts">
  import Close from 'svelte-material-icons/Close.svelte';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';

  export let showShortcuts: boolean;
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
</script>

<div class="absolute w-full h-full z-[99999]">
  <div class="flex h-full w-full place-content-center place-items-center overflow-hidden bg-black/50">
    <div
      class="w-[650px] max-w-[125vw] rounded-3xl border bg-immich-bg shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg"
    >
      <div class="relative px-4 pt-4">
        <h1 class="font-medium text-immich-primary dark:text-immich-dark-primary px-4 py-4">Keyboard Shortcuts</h1>
        <div class="absolute inset-y-0 right-0 px-4 py-4">
          <CircleIconButton logo={Close} on:click={() => (showShortcuts = !showShortcuts)} />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 px-4 pb-4">
        <div class="px-4 py-4">
          <h2>General</h2>
          <div class="text-sm">
            {#each shortcuts.general as shortcut}
              <div class="grid grid-cols-[20%_80%] gap-4 pt-4 text-sm flex items-center">
                <div class="flex justify-self-end">
                  {#each shortcut.key as key}
                    <p
                      class="bg-immich-primary/25 rounded-lg justify-self-end flex items-center justify-center p-2 mr-1"
                    >
                      {key}
                    </p>
                  {/each}
                </div>
                <p class="flex mt-1 mb-1">{shortcut.action}</p>
              </div>
            {/each}
          </div>
        </div>

        <div class="px-4 py-4">
          <h2>Actions</h2>
          <div class="text-sm">
            {#each shortcuts.actions as shortcut}
              <div class="grid grid-cols-[20%_80%] gap-4 pt-4 text-sm flex items-center">
                <div class="flex justify-self-end">
                  {#each shortcut.key as key}
                    <p
                      class="bg-immich-primary/25 rounded-lg justify-self-end flex items-center justify-center p-2 mr-1"
                    >
                      {key}
                    </p>
                  {/each}
                </div>
                <p class="flex mt-1 mb-1">{shortcut.action}</p>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
