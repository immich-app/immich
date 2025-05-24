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
  import { Button, Text } from '@immich/ui';
  import { mdiCheck } from '@mdi/js';
  import { Popover } from 'bits-ui';
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
    fullWidthButton?: boolean;
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
    fullWidthButton = true,
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
</script>

<!-- BUTTON TITLE -->
<Popover.Root bind:open={showMenu}>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button {...props} fullWidth={fullWidthButton} {title} variant="ghost" color="secondary" size="small">
        {#if renderedSelectedOption?.icon}
          <Icon path={renderedSelectedOption.icon} />
        {/if}
        <Text class={hideTextOnSmallScreen ? 'hidden sm:block' : ''}>{renderedSelectedOption.title}</Text>
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Portal>
    <Popover.Content
      align={position === 'bottom-left' ? 'start' : 'end'}
      forceMount
      onInteractOutside={handleClickOutside}
    >
      {#snippet child({ props, wrapperProps, open })}
        <!-- DROP DOWN MENU -->
        {#if open}
          <div {...wrapperProps}>
            <div
              {...props}
              class={[
                'text-sm font-medium flex min-w-[250px] max-h-[70vh] overflow-y-auto immich-scrollbar flex-col rounded-2xl bg-gray-100 py-2 text-black shadow-lg dark:bg-gray-700 dark:text-white',
                className,
                props.class,
              ]}
              transition:fly={{ y: -30, duration: 250 }}
            >
              {#each options as option (option)}
                {@const renderedOption = renderOption(option)}
                {@const buttonStyle = renderedOption.disabled
                  ? ''
                  : 'transition-all hover:bg-gray-300 dark:hover:bg-gray-800'}
                <button
                  type="button"
                  class="grid grid-cols-[36px_1fr] place-items-center p-2 disabled:opacity-40 {buttonStyle}"
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
          </div>
        {/if}
      {/snippet}
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
