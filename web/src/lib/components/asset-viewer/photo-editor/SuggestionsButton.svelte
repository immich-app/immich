<script lang="ts">
  export let isActive: boolean = false;
  export let buttonName = 'Optimize';
</script>

<button
  class:active-edit={isActive}
  on:click
  class="rounded-lg bg-immich-gray/10 hover:bg-immich-gray/20 text-white w-full flex items-center h-16"
>
  <div class="px-8 text-2xl">
    <slot />
  </div>
  {buttonName}
</button>

<style>
  .active-edit {
    background-color: #adcbfa;
    color: rgb(33, 33, 33);
  }
</style>
