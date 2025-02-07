<script lang="ts">
  import { generateId } from '$lib/utils/generate-id';

  interface Props {
    filters: string[];
    labels?: string[];
    selected: string;
    label: string;
    onSelect: (selected: string) => void;
  }

  let { filters, selected, label, labels, onSelect }: Props = $props();

  const id = `group-tab-${generateId()}`;
</script>

<fieldset
  class="dark:bg-immich-dark-gray flex h-full rounded-2xl bg-gray-200 ring-gray-400 has-[:focus-visible]:ring dark:ring-gray-600"
>
  <legend class="sr-only">{label}</legend>
  {#each filters as filter, index}
    <div class="group">
      <input
        type="radio"
        name={id}
        id="{id}-{index}"
        class="peer sr-only"
        value={filter}
        checked={filter === selected}
        onchange={() => onSelect(filter)}
      />
      <label
        for="{id}-{index}"
        class="flex h-full cursor-pointer items-center px-4 text-sm hover:bg-gray-300 group-first-of-type:rounded-s-2xl group-last-of-type:rounded-e-2xl peer-checked:bg-gray-300 dark:hover:bg-gray-800 peer-checked:dark:bg-gray-700"
      >
        {labels?.[index] ?? filter}
      </label>
    </div>
  {/each}
</fieldset>
