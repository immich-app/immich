<script lang="ts">
  import { Permission } from '@immich/sdk';
  import { Checkbox, Label } from '@immich/ui';

  interface Props {
    title: string;
    subItems: Permission[];
    selectedItems: Permission[];
    handleSelectItems: (permissions: Permission[]) => void;
    handleDeselectItems: (permissions: Permission[]) => void;
  }

  let { title, subItems, selectedItems, handleSelectItems, handleDeselectItems }: Props = $props();

  let selectAllSubItems = $derived(subItems.filter((item) => selectedItems.includes(item)).length === subItems.length);

  const handleSelectAllSubItems = () => {
    if (selectAllSubItems) {
      handleDeselectItems(subItems);
    } else {
      handleSelectItems(subItems);
    }
  };

  const handleToggleItem = (permission: Permission) => {
    if (selectedItems.includes(permission)) {
      handleDeselectItems([permission]);
    } else {
      handleSelectItems([permission]);
    }
  };
</script>

<div class="mx-4 my-2 border bg-subtle dark:bg-black/30 dark:border-black p-4 rounded-2xl">
  <div class="flex items-center gap-2">
    <Checkbox
      id="permission-{title}"
      size="tiny"
      checked={selectAllSubItems}
      onCheckedChange={handleSelectAllSubItems}
    />
    <Label label={title} for={title} class="font-mono text-primary text-lg" />
  </div>
  <div class="mx-6 mt-3 grid grid-cols-3 gap-2">
    {#each subItems as item (item)}
      <div class="flex items-center gap-2">
        <Checkbox
          id="permission-{item}"
          size="tiny"
          checked={selectedItems.includes(item)}
          onCheckedChange={() => handleToggleItem(item)}
        />
        <Label label={item} for={item} class="text-sm font-mono" />
      </div>
    {/each}
  </div>
</div>
