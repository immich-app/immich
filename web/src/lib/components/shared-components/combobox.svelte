<script lang="ts" context="module">
  export type ComboBoxOption = {
    id?: string;
    label: string;
    value: string;
  };

  export const asComboboxOptions = (values: string[]) =>
    values.map((value) => {
      if (value === '') {
        return { label: get(t)('unknown'), value: '' };
      }

      return { label: value, value };
    });

  export const asSelectedOption = (value?: string) => (value === undefined ? undefined : asComboboxOptions([value])[0]);
</script>

<script lang="ts">
  import { fly } from 'svelte/transition';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiMagnify, mdiUnfoldMoreHorizontal, mdiClose } from '@mdi/js';
  import { onMount, tick } from 'svelte';
  import type { FormEventHandler } from 'svelte/elements';
  import { shortcuts } from '$lib/actions/shortcut';
  import { focusOutside } from '$lib/actions/focus-outside';
  import { generateId } from '$lib/utils/generate-id';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { t } from 'svelte-i18n';
  import { get } from 'svelte/store';

  export let label: string;
  export let hideLabel = false;
  export let options: ComboBoxOption[] = [];
  export let selectedOption: ComboBoxOption | undefined = undefined;
  export let placeholder = '';
  export let onSelect: (option: ComboBoxOption | undefined) => void = () => {};

  /**
   * Unique identifier for the combobox.
   */
  let id: string = generateId();
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
  let bounds: DOMRect | undefined;
  let dropdownDirection: 'bottom' | 'top' = 'bottom';

  const inputId = `combobox-${id}`;
  const listboxId = `listbox-${id}`;
  /**
   * Buffer distance between the dropdown and top/bottom of the viewport.
   */
  const dropdownOffset = 15;
  /**
   * Minimum space required for the dropdown to be displayed at the bottom of the input.
   */
  const bottomBreakpoint = 225;
  const observer = new IntersectionObserver(
    (entries) => {
      const inputEntry = entries[0];
      if (inputEntry.intersectionRatio < 1) {
        isOpen = false;
      }
    },
    { threshold: 0.5 },
  );

  $: filteredOptions = options.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()));

  $: {
    searchQuery = selectedOption ? selectedOption.label : '';
  }

  $: position = calculatePosition(bounds);

  onMount(() => {
    observer.observe(input);
    const scrollableAncestor = input.closest('.overflow-y-auto, .overflow-y-scroll');
    scrollableAncestor?.addEventListener('scroll', onPositionChange);
    window.visualViewport?.addEventListener('resize', onPositionChange);
    window.visualViewport?.addEventListener('scroll', onPositionChange);

    return () => {
      observer.disconnect();
      scrollableAncestor?.removeEventListener('scroll', onPositionChange);
      window.visualViewport?.removeEventListener('resize', onPositionChange);
      window.visualViewport?.removeEventListener('scroll', onPositionChange);
    };
  });

  const activate = () => {
    isActive = true;
    searchQuery = '';
    openDropdown();
  };

  const deactivate = () => {
    searchQuery = selectedOption ? selectedOption.label : '';
    isActive = false;
    closeDropdown();
  };

  const openDropdown = () => {
    isOpen = true;
    bounds = getInputPosition();
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

  let handleSelect = (option: ComboBoxOption) => {
    selectedOption = option;
    searchQuery = option.label;
    onSelect(option);
    closeDropdown();
  };

  const onClear = () => {
    input?.focus();
    selectedIndex = undefined;
    selectedOption = undefined;
    searchQuery = '';
    onSelect(selectedOption);
  };

  const calculatePosition = (boundary: DOMRect | undefined) => {
    const visualViewport = window.visualViewport;
    dropdownDirection = getComboboxDirection(boundary, visualViewport);

    if (!boundary) {
      return;
    }

    const left = boundary.left + (visualViewport?.offsetLeft || 0);
    const offsetTop = visualViewport?.offsetTop || 0;

    if (dropdownDirection === 'top') {
      return {
        bottom: `${window.innerHeight - boundary.top - offsetTop}px`,
        left: `${left}px`,
        width: `${boundary.width}px`,
        maxHeight: maxHeight(boundary.top - dropdownOffset),
      };
    }

    const viewportHeight = visualViewport?.height || 0;
    const availableHeight = viewportHeight - boundary.bottom;
    return {
      top: `${boundary.bottom + offsetTop}px`,
      left: `${left}px`,
      width: `${boundary.width}px`,
      maxHeight: maxHeight(availableHeight - dropdownOffset),
    };
  };

  const maxHeight = (size: number) => `min(${size}px,18rem)`;

  const onPositionChange = () => {
    if (!isOpen) {
      return;
    }
    bounds = getInputPosition();
  };

  const getComboboxDirection = (
    boundary: DOMRect | undefined,
    visualViewport: VisualViewport | null,
  ): 'bottom' | 'top' => {
    if (!boundary) {
      return 'bottom';
    }

    const visualHeight = visualViewport?.height || 0;
    const heightBelow = visualHeight - boundary.bottom;
    const heightAbove = boundary.top;

    const isViewportScaled = visualHeight && Math.floor(visualHeight) !== Math.floor(window.innerHeight);

    return heightBelow <= bottomBreakpoint && heightAbove > heightBelow && !isViewportScaled ? 'top' : 'bottom';
  };

  const getInputPosition = () => input?.getBoundingClientRect();
</script>

<svelte:window on:resize={onPositionChange} />
<label class="immich-form-label" class:sr-only={hideLabel} for={inputId}>{label}</label>
<div
  class="relative w-full dark:text-gray-300 text-gray-700 text-base"
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
      class:!rounded-b-none={isOpen && dropdownDirection === 'bottom'}
      class:!rounded-t-none={isOpen && dropdownDirection === 'top'}
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
              handleSelect(filteredOptions[selectedIndex]);
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
        <CircleIconButton on:click={onClear} title={$t('clear_value')} icon={mdiClose} size="16" padding="2" />
      {:else if !isOpen}
        <Icon path={mdiUnfoldMoreHorizontal} ariaHidden={true} />
      {/if}
    </div>
  </div>

  <ul
    role="listbox"
    id={listboxId}
    transition:fly={{ duration: 250 }}
    class="fixed text-left text-sm w-full overflow-y-auto bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-900 z-[10000]"
    class:rounded-b-xl={dropdownDirection === 'bottom'}
    class:rounded-t-xl={dropdownDirection === 'top'}
    class:shadow={dropdownDirection === 'bottom'}
    class:border={isOpen}
    style:top={position?.top}
    style:bottom={position?.bottom}
    style:left={position?.left}
    style:width={position?.width}
    style:max-height={position?.maxHeight}
    tabindex="-1"
  >
    {#if isOpen}
      {#if filteredOptions.length === 0}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <li
          role="option"
          aria-selected={selectedIndex === 0}
          aria-disabled={true}
          class="text-left w-full px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-default aria-selected:bg-gray-200 aria-selected:dark:bg-gray-700"
          id={`${listboxId}-${0}`}
          on:click={() => closeDropdown()}
        >
          {$t('no_results')}
        </li>
      {/if}
      {#each filteredOptions as option, index (option.id || option.label)}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <li
          aria-selected={index === selectedIndex}
          bind:this={optionRefs[index]}
          class="text-left w-full px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all cursor-pointer aria-selected:bg-gray-200 aria-selected:dark:bg-gray-700 break-words"
          id={`${listboxId}-${index}`}
          on:click={() => handleSelect(option)}
          role="option"
        >
          {option.label}
        </li>
      {/each}
    {/if}
  </ul>
</div>
