<script lang="ts">
  import type { SearchOptions } from '$lib/utils/dipatch';
  import { IconButton, LoadingSpinner } from '@immich/ui';
  import { mdiClose, mdiMagnify } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    name: string;
    roundedBottom?: boolean;
    showLoadingSpinner: boolean;
    placeholder: string;
    onSearch?: (options: SearchOptions) => void;
    onReset?: () => void;
  }

  let {
    name = $bindable(),
    roundedBottom = true,
    showLoadingSpinner,
    placeholder,
    onSearch = () => {},
    onReset = () => {},
  }: Props = $props();

  let inputRef = $state<HTMLElement>();

  const resetSearch = () => {
    name = '';
    onReset();
    inputRef?.focus();
  };

  const handleSearch = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      onSearch({ force: true });
    }
  };
</script>

<div
  class="flex items-center text-sm {roundedBottom
    ? 'rounded-2xl'
    : 'rounded-t-lg'} bg-gray-200 p-2 dark:bg-immich-dark-gray gap-2 place-items-center h-full"
>
  <IconButton
    shape="round"
    color="secondary"
    variant="ghost"
    icon={mdiMagnify}
    aria-label={$t('search')}
    size="small"
    onclick={() => onSearch({ force: true })}
  />
  <input
    class="w-full gap-2 bg-gray-200 dark:bg-immich-dark-gray dark:text-white"
    type="text"
    {placeholder}
    bind:value={name}
    bind:this={inputRef}
    onkeydown={handleSearch}
    oninput={() => onSearch({ force: false })}
  />
  {#if showLoadingSpinner}
    <div class="flex place-items-center">
      <LoadingSpinner />
    </div>
  {/if}
  {#if name}
    <IconButton
      shape="round"
      color="secondary"
      variant="ghost"
      icon={mdiClose}
      aria-label={$t('clear_value')}
      size="small"
      onclick={resetSearch}
    />
  {/if}
</div>
