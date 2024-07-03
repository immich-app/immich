<script lang="ts" context="module">
  export type DropDownOption<T = unknown> = {
    label: string;
    value: T;
  };
</script>

<script lang="ts">
  export let options: DropDownOption[];
  export let selected = options.at(0);
  export let disabled = false;

  export let isOpen = false;
  const toggle = () => (isOpen = !isOpen);
</script>

<div id="immich-dropdown" class="relative">
  <button
    type="button"
    {disabled}
    on:click={toggle}
    aria-expanded={isOpen}
    class="flex w-full place-items-center justify-between rounded-lg bg-gray-200 p-2 disabled:cursor-not-allowed disabled:bg-gray-600 dark:bg-gray-600 dark:disabled:bg-gray-300"
  >
    {#if selected}
      <div>
        {selected.label}
      </div>
    {/if}

    <div>
      <svg
        style="tran"
        width="20"
        height="20"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </button>

  {#if isOpen}
    <div class="absolute mt-2 flex w-full flex-col">
      {#each options as option}
        <button
          type="button"
          on:click={() => {
            selected = option;
            isOpen = false;
          }}
          class="flex w-full bg-gray-200 p-2 transition-all hover:bg-gray-300 dark:bg-gray-500 dark:hover:bg-gray-700"
        >
          {option.label}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  svg {
    transition: transform 0.2s ease-in;
  }

  [aria-expanded='true'] svg {
    transform: rotate(0.5turn);
  }
</style>
