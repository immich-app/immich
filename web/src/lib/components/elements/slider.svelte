<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let checked = false;
  export let disabled = false;

  const dispatch = createEventDispatcher<{ toggle: boolean }>();
  const onToggle = (event: Event) => dispatch('toggle', (event.target as HTMLInputElement).checked);
</script>

<label class="relative inline-block h-[10px] w-[36px] flex-none">
  <input
    class="disabled::cursor-not-allowed h-0 w-0 opacity-0"
    type="checkbox"
    bind:checked
    on:click={onToggle}
    {disabled}
  />

  {#if disabled}
    <span class="slider slider-disabled cursor-not-allowed" />
  {:else}
    <span class="slider slider-enabled cursor-pointer" />
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
    -webkit-transition: 0.4s;
    transition: 0.4s;
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
    left: 0px;
    right: 0px;
    bottom: -4px;
    background-color: gray;
    -webkit-transition: 0.4s;
    transition: 0.4s;
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
