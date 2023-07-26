<script lang="ts">
  import SwapVertical from 'svelte-material-icons/SwapVertical.svelte';
  import Check from 'svelte-material-icons/Check.svelte';
  import LinkButton from './buttons/link-button.svelte';
  import { clickOutside } from '$lib/utils/click-outside';
  import { fly } from 'svelte/transition';

  export let options: string[] = [];
  export let value = options[0];

  let showMenu = false;

  const handleClickOutside = () => {
    showMenu = false;
  };

  const handleSelectOption = (index: number) => {
    value = options[index];
    showMenu = false;
  };
</script>

<div id="dropdown-button" use:clickOutside on:outclick={handleClickOutside}>
  <!-- BUTTON TITLE -->
  <LinkButton on:click={() => (showMenu = true)}>
    <div class="flex place-items-center gap-2 text-sm">
      <SwapVertical size="18" />
      {value}
    </div>
  </LinkButton>

  <!-- DROP DOWN MENU -->
  {#if showMenu}
    <div
      transition:fly={{ y: -30, x: 30, duration: 200 }}
      class="text-md absolute right-0 top-5 z-50 flex min-w-[250px] flex-col rounded-2xl bg-gray-100 py-4 text-black shadow-lg dark:bg-gray-700 dark:text-white"
    >
      {#each options as option, index (option)}
        <button
          class="grid grid-cols-[20px,1fr] place-items-center gap-2 p-4 transition-all hover:bg-gray-300 dark:hover:bg-gray-800"
          on:click={() => handleSelectOption(index)}
        >
          {#if value == option}
            <div class="font-medium text-immich-primary dark:text-immich-dark-primary">
              <Check size="18" />
            </div>
            <p class="justify-self-start font-medium text-immich-primary dark:text-immich-dark-primary">
              {option}
            </p>
          {:else}
            <div />
            <p class="justify-self-start">
              {option}
            </p>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
