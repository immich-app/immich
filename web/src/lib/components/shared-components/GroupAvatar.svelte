<script lang="ts">
  import { Icon, type Size } from '@immich/ui';
  import { mdiAccountMultipleOutline } from '@mdi/js';

  type Group = {
    name: string;
    description: string | null;
  };

  interface Props {
    group: Group;
    size?: Size;
  }

  let { group, size = 'medium' }: Props = $props();

  const getDescription = (group: Group) => {
    return group.name + (group.description ? ` - ${group.description}` : '');
  };

  const title = $derived(getDescription(group));

  const sizes: Record<Size, string> = {
    tiny: 'h-5 w-5 text-xs',
    small: 'h-7 w-7 text-sm',
    medium: 'h-10 w-10 text-base',
    large: 'h-12 w-12 text-lg',
    giant: 'h-16 w-16 text-xl',
  };
</script>

<!-- <Avatar name={group.name} {color} {size} /> -->
<span class="{sizes[size]} shrink-0 bg-subtle text-primary rounded-full p-2 border border-light" {title}>
  <Icon size="100%" icon={mdiAccountMultipleOutline} />
</span>
