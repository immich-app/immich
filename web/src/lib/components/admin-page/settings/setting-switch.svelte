<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  export let title: string;
  export let subtitle = '';
  export let checked = false;
  export let disabled = false;
  export let isEdited = false;
</script>

<div class="flex place-items-center justify-between">
  <div>
    <div class="flex h-[26px] place-items-center gap-1">
      <label class="immich-form-label text-sm" for={title}>
        {title}
      </label>
      {#if isEdited}
        <div
          transition:fly={{ x: 10, duration: 200, easing: quintOut }}
          class="rounded-full bg-orange-100 px-2 text-[10px] text-orange-900"
        >
          Unsaved change
        </div>
      {/if}
    </div>

    <p class="text-sm dark:text-immich-dark-fg">{subtitle}</p>
  </div>

  <label class="relative inline-block h-[10px] w-[36px] flex-none">
    <input class="disabled::cursor-not-allowed h-0 w-0 opacity-0" type="checkbox" bind:checked on:click {disabled} />

    {#if disabled}
      <span class="slider-disable cursor-not-allowed" />
    {:else}
      <span class="slider cursor-pointer" />
    {/if}
  </label>
</div>

<style>
  .slider,
  .slider-disable {
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

  .slider:before,
  .slider-disable:before {
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

  input:checked + .slider-disable {
    background-color: gray;
  }

  input:checked + .slider {
    background-color: #adcbfa;
  }

  input:checked + .slider:before {
    -webkit-transform: translateX(18px);
    -ms-transform: translateX(18px);
    transform: translateX(18px);
    background-color: #4250af;
  }
</style>
