<script lang="ts" context="module">
  // Necessary for eslint
  /* eslint-disable @typescript-eslint/no-explicit-any */
  type T = any;
</script>

<script lang="ts" generics="T">
  import Icon from './icon.svelte';

  import { mdiCheck } from '@mdi/js';

  import { isEqual } from 'lodash-es';
  import LinkButton from './buttons/link-button.svelte';
  import { clickOutside } from '$lib/utils/click-outside';
  import { fly } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';

  let className = '';
  export { className as class };

  const dispatch = createEventDispatcher<{
    select: T;
    'click-outside': void;
  }>();

  export let options: T[];
  export let selectedOption = options[0];

  export let render: (item: T) => string | RenderedOption = String;

  type RenderedOption = {
    title: string;
    icon?: string;
  };

  export let showMenu = false;
  export let controlable = false;

  const handleClickOutside = () => {
    if (!controlable) {
      showMenu = false;
    }

    dispatch('click-outside');
  };

  const handleSelectOption = (option: T) => {
    dispatch('select', option);
    selectedOption = option;

    showMenu = false;
  };

  const renderOption = (option: T): RenderedOption => {
    const renderedOption = render(option);
    switch (typeof renderedOption) {
      case 'string': {
        return { title: renderedOption };
      }
      default: {
        return {
          title: renderedOption.title,
          icon: renderedOption.icon,
        };
      }
    }
  };

  $: renderedSelectedOption = renderOption(selectedOption);
</script>

<div id="dropdown-button" use:clickOutside on:outclick={handleClickOutside} on:escape={handleClickOutside}>
  <!-- BUTTON TITLE -->
  <LinkButton on:click={() => (showMenu = true)} fullwidth>
    <div class="flex place-items-center gap-2 text-sm">
      {#if renderedSelectedOption?.icon}
        <Icon path={renderedSelectedOption.icon} size="18" />
      {/if}
      <p class="hidden sm:block">{renderedSelectedOption.title}</p>
    </div>
  </LinkButton>

  <!-- DROP DOWN MENU -->
  {#if showMenu}
    <div
      transition:fly={{ y: -30, x: 30, duration: 100 }}
      class="text-md fixed z-50 flex min-w-[250px] max-h-[70vh] overflow-y-scroll immich-scrollbar flex-col rounded-2xl bg-gray-100 py-2 text-black shadow-lg dark:bg-gray-700 dark:text-white {className}"
    >
      {#each options as option (option)}
        {@const renderedOption = renderOption(option)}
        <button
          class="grid grid-cols-[20px,1fr] place-items-center p-2 transition-all hover:bg-gray-300 dark:hover:bg-gray-800"
          on:click={() => handleSelectOption(option)}
        >
          {#if isEqual(selectedOption, option)}
            <div class="text-immich-primary dark:text-immich-dark-primary">
              <Icon path={mdiCheck} size="18" />
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
