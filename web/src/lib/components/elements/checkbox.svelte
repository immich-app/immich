<script lang="ts">
  interface Props {
    id: string;
    label: string;
    checked?: boolean | undefined;
    disabled?: boolean;
    labelClass?: string | undefined;
    name?: string | undefined;
    value?: string | undefined;
    onchange?: () => void;
  }

  let {
    id,
    label,
    checked = $bindable(),
    disabled = false,
    labelClass = undefined,
    name = undefined,
    value = undefined,
    onchange = () => {},
  }: Props = $props();
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
    {onchange}
  />
  <label class={labelClass} for={id}>{label}</label>
</div>
