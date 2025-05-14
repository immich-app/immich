<script lang="ts">
  import Checkbox from '../elements/checkbox.svelte';
  import { Permission } from '@immich/sdk';

  interface Props {
    title: string;
    subItems: Permission[];
    selectedItems: Permission[];
    handleSelectItems: (permissions: Permission[]) => void;
    handleDeselectItems: (permissions: Permission[]) => void;
  }

  let { title, subItems, selectedItems, handleSelectItems, handleDeselectItems }: Props = $props();

  let selectAllItems = $state(false);

  const handleSelectAll = () => {
    if (selectAllItems) {
      handleSelectItems(subItems);
    } else {
      handleDeselectItems(subItems);
    }
  };

  const handleToggleItem = (permission: Permission) => {
    if (!selectedItems.includes(permission)) {
      handleSelectItems([permission]);
    } else {
      handleDeselectItems([permission]);
    }
  };
</script>

<div class="m-4 flex flex-col gap-2">
  <Checkbox
    id={title}
    label={title}
    labelClass="text-sm dark:text-immich-dark-fg"
    bind:checked={selectAllItems}
    onchange={handleSelectAll}
  />
  <div class="ml-4 flex flex-wrap gap-x-5 gap-y-2">
    {#each subItems as item (item)}
      <Checkbox
        id={item}
        label={item}
        labelClass="text-sm dark:text-immich-dark-fg"
        checked={selectedItems.includes(item) || selectedItems.includes(Permission.All)}
        onchange={() => {
          handleToggleItem(item);
        }}
      />
    {/each}
  </div>
</div>
