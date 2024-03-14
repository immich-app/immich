<script lang="ts" context="module">
  export type ComboBoxOption = {
    label: string;
    value: string;
  };

  export function toComboBoxOptions(items: string[]) {
    return items.map<ComboBoxOption>((item) => ({ label: item, value: item }));
  }
</script>

<script lang="ts">
  import { fly } from 'svelte/transition';

  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiMagnify, mdiUnfoldMoreHorizontal, mdiClose } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import IconButton from '../elements/buttons/icon-button.svelte';
  import type { FormEventHandler } from 'svelte/elements';

  export let label: string;
  export let options: ComboBoxOption[] = [];
  export let selectedOption: ComboBoxOption | undefined;
  export let placeholder = '';

  let isOpen = false;
  let searchQuery = selectedOption?.label || '';
  let selectedIndex: number | undefined;
  const inputId = `combobox-${crypto.randomUUID()}`;
  const listboxId = `listbox-${crypto.randomUUID()}`;

  $: filteredOptions = options.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()));

  const dispatch = createEventDispatcher<{
    select: ComboBoxOption | undefined;
    click: void;
  }>();

  const handleFocus = () => {
    searchQuery = '';
    isOpen = true;
    dispatch('click'); // TODO: verify this
  };

  // let handleBlur = () => {
  //   isOpen = false;
  //   selectedIndex = undefined;
  // };

  let handleSelect = (option: ComboBoxOption) => {
    selectedOption = option;
    dispatch('select', option);
    isOpen = false;
  };

  const onClear = () => {
    selectedOption = undefined;
    searchQuery = '';
    dispatch('select', selectedOption);
  };

  // create a method to increment or decrement the selected index, looping around to the other end of the list if at the beginning or end
  const incrementSelectedIndex = (increment: number) => {
    if (filteredOptions.length === 0) {
      selectedIndex = 0;
      return;
    }

    if (selectedIndex === undefined) {
      selectedIndex = -1;
    }

    selectedIndex = (selectedIndex + increment + filteredOptions.length) % filteredOptions.length;
  };

  const handleKeydown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp': {
        incrementSelectedIndex(-1);
        break;
      }
      case 'ArrowDown': {
        isOpen = true;
        incrementSelectedIndex(1);
        break;
      }
      case 'Enter': {
        if (selectedIndex !== undefined) {
          handleSelect(filteredOptions[selectedIndex]);
        }
        break;
      }
    }
  };

  const handleInput: FormEventHandler<HTMLInputElement> = (event) => {
    searchQuery = (event.target as HTMLInputElement).value;
    selectedIndex = undefined;
  };
</script>

<label class="text-sm text-black dark:text-white" for={inputId}>{label}</label>
<div class="relative w-full dark:text-gray-300 text-gray-700 text-base">
  <div>
    {#if isOpen}
      <div class="absolute inset-y-0 left-0 flex items-center pl-3">
        <div class="dark:text-immich-dark-fg/75">
          <Icon path={mdiMagnify} ariaHidden={true} />
        </div>
      </div>
    {/if}

    <input
      id={inputId}
      {placeholder}
      role="combobox"
      aria-expanded={isOpen}
      aria-controls={listboxId}
      aria-autocomplete="list"
      class="immich-form-input text-sm text-left w-full !pr-12 transition-all"
      class:!pl-8={isOpen}
      class:!rounded-b-none={isOpen}
      class:cursor-pointer={!isOpen}
      value={isOpen ? '' : selectedOption?.label || ''}
      on:input={handleInput}
      on:focus={handleFocus}
      on:keydown={handleKeydown}
    />

    <div
      class="absolute right-0 top-0 h-full flex px-4 justify-center items-center content-between"
      class:pr-2={selectedOption}
      class:pointer-events-none={!selectedOption}
    >
      {#if selectedOption}
        <IconButton color="transparent-gray" on:click={onClear} title="Clear value">
          <Icon path={mdiClose} ariaLabel="Clear" />
        </IconButton>
      {:else if !isOpen}
        <Icon path={mdiUnfoldMoreHorizontal} ariaHidden={true} />
      {/if}
    </div>
  </div>

  <div
    role="listbox"
    id={listboxId}
    transition:fly={{ duration: 250 }}
    class="absolute text-left text-sm w-full max-h-64 overflow-y-auto bg-white dark:bg-gray-800 rounded-b-lg border border-t-0 border-gray-300 dark:border-gray-900 z-10"
    tabindex="-1"
  >
    {#if isOpen}
      {#if filteredOptions.length === 0}
        <div class="px-4 py-2 font-medium">No results</div>
      {/if}
      {#each filteredOptions as option, index (option.label)}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          role="option"
          aria-selected={index === selectedIndex}
          class="text-left w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          class:bg-gray-100={index === selectedIndex}
          class:dark:bg-gray-700={index === selectedIndex}
          on:click={() => handleSelect(option)}
          tabindex="-1"
        >
          {option.label}
        </div>
      {/each}
    {/if}
  </div>
</div>
