<script lang="ts">
  /**
   * Unique identifier for the checkbox element, used to associate labels with the input element.
   */
  export let id: string;
  /**
   * Optional aria-describedby attribute to associate the checkbox with a description.
   */
  export let ariaDescribedBy: string | undefined = undefined;
  export let checked = false;
  export let disabled = false;
  export let onToggle: ((checked: boolean) => void) | undefined = undefined;

  const handleToggle = (event: Event) => onToggle?.((event.target as HTMLInputElement).checked);
</script>

<label class="relative inline-block h-[10px] w-[36px] flex-none">
  <input
    {id}
    class="disabled::cursor-not-allowed h-0 w-0 opacity-0 peer"
    type="checkbox"
    bind:checked
    on:click={handleToggle}
    {disabled}
    aria-describedby={ariaDescribedBy}
  />

  {#if disabled}
    <span
      class="slider slider-disabled cursor-not-allowed border border-transparent before:border before:border-transparent"
    />
  {:else}
    <span
      class="slider slider-enabled cursor-pointer border-2 border-transparent before:border-2 before:border-transparent peer-focus-visible:outline before:peer-focus-visible:outline peer-focus-visible:dark:outline-gray-200 before:peer-focus-visible:dark:outline-gray-200 peer-focus-visible:outline-gray-600 before:peer-focus-visible:outline-gray-600 peer-focus-visible:dark:border-black before:peer-focus-visible:dark:border-black peer-focus-visible:border-white before:peer-focus-visible:border-white"
    />
  {/if}
</label>

<style>
  .slider {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    -webkit-transition: transform 0.4s;
    transition: transform 0.4s;
    border-radius: 34px;
  }

  input:disabled {
    cursor: not-allowed;
  }

  .slider:before {
    position: absolute;
    content: '';
    height: 20px;
    width: 20px;
    left: -2px;
    right: 0px;
    bottom: -6px;
    background-color: gray;
    -webkit-transition: transform 0.4s;
    transition: transform 0.4s;
    border-radius: 50%;
  }

  input:checked + .slider:before {
    -webkit-transform: translateX(18px);
    -ms-transform: translateX(18px);
    transform: translateX(18px);
    background-color: #4250af;
  }

  input:checked + .slider-disabled {
    background-color: gray;
  }

  input:checked + .slider-enabled {
    background-color: #adcbfa;
  }
</style>
