<script lang="ts">
  export let id: string;
  export let label: string;
  export let name: string;
  export let value: string;
  export let group: string | undefined = undefined;
</script>

<div class="flex items-center space-x-2">
  <input type="radio" {name} {id} {value} class="focus-visible:ring" bind:group />
  <label for={id}>{label}</label>
</div>
