<script lang="ts">
  import { UserAvatarColor } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiNewBox } from '@mdi/js';

  interface Props {
    newAssetCount: number;
    lastViewedAt: string;
    spaceColor: string;
  }

  let { newAssetCount, lastViewedAt, spaceColor }: Props = $props();

  const bgClasses: Record<string, string> = {
    [UserAvatarColor.Primary]: 'bg-immich-primary',
    [UserAvatarColor.Pink]: 'bg-pink-500',
    [UserAvatarColor.Red]: 'bg-red-500',
    [UserAvatarColor.Yellow]: 'bg-yellow-500',
    [UserAvatarColor.Blue]: 'bg-blue-500',
    [UserAvatarColor.Green]: 'bg-green-600',
    [UserAvatarColor.Purple]: 'bg-purple-600',
    [UserAvatarColor.Orange]: 'bg-orange-500',
    [UserAvatarColor.Gray]: 'bg-gray-500',
    [UserAvatarColor.Amber]: 'bg-amber-500',
  };

  let bgClass = $derived(bgClasses[spaceColor ?? 'primary'] ?? bgClasses[UserAvatarColor.Primary]);

  let formattedDate = $derived.by(() => {
    const date = new Date(lastViewedAt);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  });
</script>

{#if newAssetCount > 0}
  <div class="sticky top-0 z-10 flex items-center gap-3 py-2" data-testid="new-assets-divider">
    <div class="h-px flex-1 bg-gray-300 dark:bg-gray-700"></div>
    <div
      class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white {bgClass}"
      data-testid="new-assets-pill"
    >
      <Icon icon={mdiNewBox} size="14" />
      <span>{newAssetCount} new &middot; since {formattedDate}</span>
    </div>
    <div class="h-px flex-1 bg-gray-300 dark:bg-gray-700"></div>
  </div>
{/if}
