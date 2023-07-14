<script lang="ts">
  export let title: string = 'Free';
  export let isActive: boolean = false;

  import Check from 'svelte-material-icons/Check.svelte';
</script>

<div class=" text-sm text-center w-fit text-immich-gray/70" class:isActive>
  {#if isActive}
    <div class="bg-immich-primary w-[92px] h-[92px] text-3xl flex items-center justify-center">
      <Check />
    </div>
  {:else}
    <img class="w-[92px] h-[92px] bg-immich-gray/10" src="" alt="asset preview" />
  {/if}
  <div class="my-[4px]">{title}</div>
</div>

<style>
  .isActive {
    color: white;
  }
</style>
