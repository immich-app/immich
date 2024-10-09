<script lang="ts" context="module">
  // Necessary for eslint
  /* eslint-disable @typescript-eslint/no-explicit-any */
  type T = any;

  export type RenderedOption = {
    title: string;
    icon?: string;
    disabled?: boolean;
  };
</script>

<script lang="ts" generics="T">
  import Icon from './icon.svelte';

  import { mdiCheck } from '@mdi/js';

  import { isEqual } from 'lodash-es';
  import LinkButton from './buttons/link-button.svelte';
  import { clickOutside } from '$lib/actions/click-outside';
  import { fly } from 'svelte/transition';

  let className = '';
  export { className as class };

  export let options: T[];
  export let selectedOption = options[0];
  export let showMenu = false;
  export let controlable = false;
  export let hideTextOnSmallScreen = true;
  export let title: string | undefined = undefined;
  export let onSelect: (option: T) => void;
  export let onClickOutside: () => void = () => {};

  export let render: (item: T) => string | RenderedOption = String;

  const handleClickOutside = () => {
    if (!controlable) {
      showMenu = false;
    }

    onClickOutside();
  };

  const handleSelectOption = (option: T) => {
    onSelect(option);
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
          disabled: renderedOption.disabled,
        };
      }
    }
  };

  $: renderedSelectedOption = renderOption(selectedOption);
</script>

<div use:clickOutside={{ onOutclick: handleClickOutside, onEscape: handleClickOutside }}>
  <!-- BUTTON TITLE -->
  <LinkButton on:click={() => (showMenu = true)} fullwidth {title}>
    <div class="flex place-items-center gap-2 text-sm">
      {#if renderedSelectedOption?.icon}
        <Icon path={renderedSelectedOption.icon} size="18" />
      {/if}
      <p class={hideTextOnSmallScreen ? 'hidden sm:block' : ''}>{renderedSelectedOption.title}</p>
    </div>
  </LinkButton>

  <!-- DROP DOWN MENU -->
  {#if showMenu}
    <div
      transition:fly={{ y: -30, duration: 250 }}
      class="text-sm font-medium fixed z-50 flex min-w-[250px] max-h-[70vh] overflow-y-auto immich-scrollbar flex-col rounded-2xl bg-gray-100 py-2 text-black shadow-lg dark:bg-gray-700 dark:text-white {className}"
    >
      {#each options as option (option)}
        {@const renderedOption = renderOption(option)}
        {@const buttonStyle = renderedOption.disabled ? '' : 'transition-all hover:bg-gray-300 dark:hover:bg-gray-800'}
        <button
          type="button"
          class="grid grid-cols-[36px,1fr] place-items-center p-2 disabled:opacity-40 {buttonStyle}"
          disabled={renderedOption.disabled}
          on:click={() => !renderedOption.disabled && handleSelectOption(option)}
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
