<script lang="ts" module>
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
  import { clickOutside } from '$lib/actions/click-outside';
  import { Button, Text } from '@immich/ui';
  import { mdiCheck } from '@mdi/js';
  import { isEqual } from 'lodash-es';
  import { fly } from 'svelte/transition';
  import Icon from './icon.svelte';

  interface Props {
    class?: string;
    options: T[];
    selectedOption?: any;
    showMenu?: boolean;
    controlable?: boolean;
    hideTextOnSmallScreen?: boolean;
    title?: string | undefined;
    position?: 'bottom-left' | 'bottom-right';
    onSelect: (option: T) => void;
    onClickOutside?: () => void;
    render?: (item: T) => string | RenderedOption;
  }

  let {
    position = 'bottom-left',
    class: className = '',
    options,
    selectedOption = $bindable(options[0]),
    showMenu = $bindable(false),
    controlable = false,
    hideTextOnSmallScreen = true,
    title = undefined,
    onSelect,
    onClickOutside = () => {},
    render = String,
  }: Props = $props();

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

  let renderedSelectedOption = $derived(renderOption(selectedOption));

  const getAlignClass = (position: 'bottom-left' | 'bottom-right') => {
    switch (position) {
      case 'bottom-left': {
        return 'start-0';
      }
      case 'bottom-right': {
        return 'end-0';
      }

      default: {
        return '';
      }
    }
  };
</script>

<div use:clickOutside={{ onOutclick: handleClickOutside, onEscape: handleClickOutside }} class="relative">
  <!-- BUTTON TITLE -->
  <Button onclick={() => (showMenu = true)} fullWidth {title} variant="ghost" color="secondary" size="small">
    {#if renderedSelectedOption?.icon}
      <Icon path={renderedSelectedOption.icon} />
    {/if}
    <Text class={hideTextOnSmallScreen ? 'hidden sm:block' : ''}>{renderedSelectedOption.title}</Text>
  </Button>

  <!-- DROP DOWN MENU -->
  {#if showMenu}
    <div
      transition:fly={{ y: -30, duration: 250 }}
      class="text-sm font-medium absolute z-50 flex min-w-[250px] max-h-[70vh] overflow-y-auto immich-scrollbar flex-col rounded-2xl bg-gray-100 py-2 text-black shadow-lg dark:bg-gray-700 dark:text-white {className} {getAlignClass(
        position,
      )}"
    >
      {#each options as option (option)}
        {@const renderedOption = renderOption(option)}
        {@const buttonStyle = renderedOption.disabled ? '' : 'transition-all hover:bg-gray-300 dark:hover:bg-gray-800'}
        <button
          type="button"
          class="grid grid-cols-[36px,1fr] place-items-center p-2 disabled:opacity-40 {buttonStyle}"
          disabled={renderedOption.disabled}
          onclick={() => !renderedOption.disabled && handleSelectOption(option)}
        >
          {#if isEqual(selectedOption, option)}
            <div class="text-immich-primary dark:text-immich-dark-primary">
              <Icon path={mdiCheck} />
            </div>
            <p class="justify-self-start text-immich-primary dark:text-immich-dark-primary">
              {renderedOption.title}
            </p>
          {:else}
            <div></div>
            <p class="justify-self-start">
              {renderedOption.title}
            </p>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
