<script lang="ts" context="module">
  // Necessary for eslint
  /* eslint-disable @typescript-eslint/no-explicit-any */
  type T = any;
</script>

<script lang="ts" generics="T">
  import _ from 'lodash';
  import LinkButton from './buttons/link-button.svelte';
  import { clickOutside } from '$lib/utils/click-outside';
  import { fly } from 'svelte/transition';
  import type Icon from 'svelte-material-icons/DotsVertical.svelte';
  import Check from 'svelte-material-icons/Check.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    select: T;
  }>();

  export let options: T[];
  export let selectedOption = options[0];

  export let render: (item: T) => string | RenderedOption = (item) => String(item);

  type RenderedOption = {
    title: string;
    icon?: typeof Icon;
  };

  let showMenu = false;

  const handleClickOutside = () => {
    showMenu = false;
  };

  const handleSelectOption = (option: T) => {
    dispatch('select', option);
    selectedOption = option;

    showMenu = false;
  };

  const renderOption = (option: T): RenderedOption => {
    const renderedOption = render(option);
    switch (typeof renderedOption) {
      case 'string':
        return { title: renderedOption };
      default:
        return {
          title: renderedOption.title,
          icon: renderedOption.icon,
        };
    }
  };

  $: renderedSelectedOption = renderOption(selectedOption);
</script>

<div id="dropdown-button" use:clickOutside on:outclick={handleClickOutside} on:escape={handleClickOutside}>
  <!-- BUTTON TITLE -->
  <LinkButton on:click={() => (showMenu = true)}>
    <div class="flex place-items-center gap-2 text-sm">
      {#if renderedSelectedOption?.icon}
        <svelte:component this={renderedSelectedOption.icon} size="18" />
      {/if}
      <p class="hidden sm:block">{renderedSelectedOption.title}</p>
    </div>
  </LinkButton>

  <!-- DROP DOWN MENU -->
  {#if showMenu}
    <div
      transition:fly={{ y: -30, x: 30, duration: 200 }}
      class="text-md absolute right-0 top-5 z-50 flex min-w-[250px] flex-col rounded-2xl bg-gray-100 py-4 text-black shadow-lg dark:bg-gray-700 dark:text-white"
    >
      {#each options as option (option)}
        {@const renderedOption = renderOption(option)}
        <button
          class="grid grid-cols-[20px,1fr] place-items-center gap-2 p-4 transition-all hover:bg-gray-300 dark:hover:bg-gray-800"
          on:click={() => handleSelectOption(option)}
        >
          {#if _.isEqual(selectedOption, option)}
            <div class="text-immich-primary dark:text-immich-dark-primary">
              <Check size="18" />
            </div>
            <p class="justify-self-start text-immich-primary dark:text-immich-dark-primary">
              {renderedOption.title}
            </p>
          {:else}
            <div />
            <p class="justify-self-start">
              {renderedOption.title}
            </p>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
