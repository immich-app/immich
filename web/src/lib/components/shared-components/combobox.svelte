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
  import { createEventDispatcher, tick } from 'svelte';
  import type { FormEventHandler } from 'svelte/elements';
  import { shortcuts } from '$lib/utils/shortcut';
  import { clickOutside } from '$lib/utils/click-outside';
  import { focusOutside } from '$lib/utils/focus-outside';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';

  /**
   * Unique identifier for the combobox.
   */
  export let id: string;
  export let label: string;
  export let hideLabel = false;
  export let options: ComboBoxOption[] = [];
  export let selectedOption: ComboBoxOption | undefined;
  export let placeholder = '';

  /**
   * Indicates whether or not the dropdown autocomplete list should be visible.
   */
  let isOpen = false;
  /**
   * Keeps track of whether the combobox is actively being used.
   */
  let isActive = false;
  let searchQuery = selectedOption?.label || '';
  let selectedIndex: number | undefined;
  let optionRefs: HTMLElement[] = [];
  let input: HTMLInputElement;
  const inputId = `combobox-${id}`;
  const listboxId = `listbox-${id}`;

  $: filteredOptions = options.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()));

  $: {
    searchQuery = selectedOption ? selectedOption.label : '';
  }

  const dispatch = createEventDispatcher<{
    select: ComboBoxOption | undefined;
  }>();

  const activate = () => {
    isActive = true;
    openDropdown();
  };

  const deactivate = () => {
    searchQuery = selectedOption ? selectedOption.label : '';
    isActive = false;
    closeDropdown();
  };

  const openDropdown = () => {
    isOpen = true;
  };

  const closeDropdown = () => {
    isOpen = false;
    selectedIndex = undefined;
  };

  const incrementSelectedIndex = async (increment: number) => {
    if (filteredOptions.length === 0) {
      selectedIndex = 0;
    } else if (selectedIndex === undefined) {
      selectedIndex = increment === 1 ? 0 : filteredOptions.length - 1;
    } else {
      selectedIndex = (selectedIndex + increment + filteredOptions.length) % filteredOptions.length;
    }
    await tick();
    optionRefs[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  };

  const onInput: FormEventHandler<HTMLInputElement> = (event) => {
    openDropdown();
    searchQuery = event.currentTarget.value;
    selectedIndex = undefined;
    optionRefs[0]?.scrollIntoView({ block: 'nearest' });
  };

  let onSelect = (option: ComboBoxOption) => {
    selectedOption = option;
    searchQuery = option.label;
    dispatch('select', option);
    closeDropdown();
  };

  const onClear = () => {
    input?.focus();
    selectedIndex = undefined;
    selectedOption = undefined;
    searchQuery = '';
    dispatch('select', selectedOption);
  };
</script>

<label class="text-sm text-black dark:text-white" class:sr-only={hideLabel} for={inputId}>{label}</label>
<div
  class="relative w-full dark:text-gray-300 text-gray-700 text-base"
  use:clickOutside={{ onOutclick: deactivate }}
  use:focusOutside={{ onFocusOut: deactivate }}
  use:shortcuts={[
    {
      shortcut: { key: 'Escape' },
      onShortcut: (event) => {
        event.stopPropagation();
        closeDropdown();
      },
    },
  ]}
>
  <div>
    {#if isActive}
      <div class="absolute inset-y-0 left-0 flex items-center pl-3">
        <div class="dark:text-immich-dark-fg/75">
          <Icon path={mdiMagnify} ariaHidden={true} />
        </div>
      </div>
    {/if}

    <input
      {placeholder}
      aria-activedescendant={selectedIndex || selectedIndex === 0 ? `${listboxId}-${selectedIndex}` : ''}
      aria-autocomplete="list"
      aria-controls={listboxId}
      aria-expanded={isOpen}
      autocomplete="off"
      bind:this={input}
      class:!pl-8={isActive}
      class:!rounded-b-none={isOpen}
      class:cursor-pointer={!isActive}
      class="immich-form-input text-sm text-left w-full !pr-12 transition-all"
      id={inputId}
      on:click={activate}
      on:focus={activate}
      on:input={onInput}
      role="combobox"
      type="text"
      value={searchQuery}
      use:shortcuts={[
        {
          shortcut: { key: 'ArrowUp' },
          onShortcut: () => {
            openDropdown();
            void incrementSelectedIndex(-1);
          },
        },
        {
          shortcut: { key: 'ArrowDown' },
          onShortcut: () => {
            openDropdown();
            void incrementSelectedIndex(1);
          },
        },
        {
          shortcut: { key: 'ArrowDown', alt: true },
          onShortcut: () => {
            openDropdown();
          },
        },
        {
          shortcut: { key: 'Enter' },
          onShortcut: () => {
            if (selectedIndex !== undefined && filteredOptions.length > 0) {
              onSelect(filteredOptions[selectedIndex]);
            }
            closeDropdown();
          },
        },
        {
          shortcut: { key: 'Escape' },
          onShortcut: (event) => {
            event.stopPropagation();
            closeDropdown();
          },
        },
      ]}
    />

    <div
      class="absolute right-0 top-0 h-full flex px-4 justify-center items-center content-between"
      class:pr-2={selectedOption}
      class:pointer-events-none={!selectedOption}
    >
      {#if selectedOption}
        <CircleIconButton on:click={onClear} title="Clear value" icon={mdiClose} size="16" padding="2" />
      {:else if !isOpen}
        <Icon path={mdiUnfoldMoreHorizontal} ariaHidden={true} />
      {/if}
    </div>
  </div>

  <ul
    role="listbox"
    id={listboxId}
    transition:fly={{ duration: 250 }}
    class="absolute text-left text-sm w-full max-h-64 overflow-y-auto bg-white dark:bg-gray-800 border-t-0 border-gray-300 dark:border-gray-900 rounded-b-xl z-10"
    class:border={isOpen}
    tabindex="-1"
  >
    {#if isOpen}
      {#if filteredOptions.length === 0}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <li
          role="option"
          aria-selected={selectedIndex === 0}
          aria-disabled={true}
          class="text-left w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-default aria-selected:bg-gray-100 aria-selected:dark:bg-gray-700"
          id={`${listboxId}-${0}`}
          on:click={() => closeDropdown()}
        >
          No results
        </li>
      {/if}
      {#each filteredOptions as option, index (option.label)}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <li
          aria-selected={index === selectedIndex}
          bind:this={optionRefs[index]}
          class="text-left w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer aria-selected:bg-gray-100 aria-selected:dark:bg-gray-700"
          id={`${listboxId}-${index}`}
          on:click={() => onSelect(option)}
          role="option"
        >
          {option.label}
        </li>
      {/each}
    {/if}
  </ul>
</div>
