<script lang="ts">
  export let id: string;
  export let label: string;
  export let checked: boolean | undefined = undefined;
  export let disabled: boolean = false;
  export let labelClass: string | undefined = undefined;
  export let name: string | undefined = undefined;
  export let value: string | undefined = undefined;
</script>

<div class="flex items-center space-x-2">
  <input
    type="checkbox"
    {name}
    {id}
    {value}
    {disabled}
    class="size-5 flex-shrink-0 focus-visible:ring"
    bind:checked
    on:change
  />
  <label class={labelClass} for={id}>{label}</label>
</div>
