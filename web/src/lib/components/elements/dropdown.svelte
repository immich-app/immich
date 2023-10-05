<script lang="ts">
  import Check from 'svelte-material-icons/Check.svelte';
  import LinkButton from './buttons/link-button.svelte';
  import { clickOutside } from '$lib/utils/click-outside';
  import { fly } from 'svelte/transition';
  import type Icon from 'svelte-material-icons/DotsVertical.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    select: string;
  }>();
  export let options: string[];
  export let value = options[0];
  export let icons: (typeof Icon)[] | undefined = undefined;

  let showMenu = false;

  const handleClickOutside = () => {
    showMenu = false;
  };

  const handleSelectOption = (index: number) => {
    if (options[index] === value) {
      dispatch('select', value);
    } else {
      value = options[index];
    }

    showMenu = false;
  };

  $: index = options.findIndex((option) => option === value);
  $: icon = icons?.[index];
</script>

<div id="dropdown-button" use:clickOutside on:outclick={handleClickOutside} on:escape={handleClickOutside}>
  <!-- BUTTON TITLE -->
  <LinkButton on:click={() => (showMenu = true)}>
    <div class="flex place-items-center gap-2 text-sm">
      {#if icon}
        <svelte:component this={icon} size="18" />
      {/if}
      <p class="hidden sm:block">{value}</p>
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
