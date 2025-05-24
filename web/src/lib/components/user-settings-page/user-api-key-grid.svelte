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

<div class="m-4 flex flex-col gap-2">
  <div class="flex items-center gap-2">
    <Checkbox
      id="permission-{title}"
      size="tiny"
      checked={selectAllSubItems}
      onCheckedChange={handleSelectAllSubItems}
    />
    <Label label={title} for={title} />
  </div>
  <div class="ml-4 flex flex-wrap gap-x-5 gap-y-2">
    {#each subItems as item (item)}
      <div class="flex items-center gap-2">
        <Checkbox
          id="permission-{item}"
          size="tiny"
          checked={selectedItems.includes(item)}
          onCheckedChange={() => handleToggleItem(item)}
        />
        <Label label={item} for={item} />
      </div>
    {/each}
  </div>
</div>
