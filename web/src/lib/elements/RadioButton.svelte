<script lang="ts">
  interface Props {
    id: string;
    label: string;
    name: string;
    value: string;
    group?: string | undefined;
  }

  let { id, label, name, value, group = $bindable(undefined) }: Props = $props();
</script>

<div class="flex items-center gap-2">
  <input type="radio" {name} {id} {value} class="focus-visible:ring" bind:group />
  <label for={id}>{label}</label>
</div>
