<script lang="ts">
  export let title: string = 'Free';
  export let isActive: boolean = false;
</script>

<div class="flex items-center text-white">
  <button
    on:click
    class:active-edit={isActive}
    class="rounded-full p-3 mr-3 text-3xl bg-immich-gray/10 hover:bg-immich-gray/20"
  >
    <slot />
  </button>
  <span>{title}</span>
</div>

<style>
  .active-edit {
    background-color: #adcbfa;
    color: rgb(33, 33, 33);
  }
  .active-edit:hover {
    background-color: #adcbfa;
  }
</style>
