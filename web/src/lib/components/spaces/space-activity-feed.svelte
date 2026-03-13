<script lang="ts">
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import { getAssetMediaUrl } from '$lib/utils';
  import { formatTimeAgo } from '$lib/utils/timesince';
  import { UserAvatarColor, type SharedSpaceActivityResponseDto } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import { mdiChevronDown } from '@mdi/js';

  interface Props {
    activities: SharedSpaceActivityResponseDto[];
    spaceColor: string;
    onLoadMore: () => void;
    hasMore: boolean;
  }

  let { activities, spaceColor, onLoadMore, hasMore }: Props = $props();

  const HIGH_IMPACT_TYPES = new Set(['asset_add', 'asset_remove']);
  const MEDIUM_TYPES = new Set(['member_join', 'member_leave', 'member_remove', 'member_role_change']);

  function getDayLabel(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today.getTime() - targetDay.getTime()) / 86_400_000);

    if (diffDays === 0) {
      return 'Today';
    }
    if (diffDays === 1) {
      return 'Yesterday';
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function getDescription(activity: SharedSpaceActivityResponseDto): string {
    const data = activity.data as Record<string, unknown>;
    const name = activity.userName ?? 'Someone';

    switch (activity.type) {
      case 'asset_add': {
        return `${name} added ${data.count ?? 0} photos`;
      }
      case 'asset_remove': {
        return `${name} removed ${data.count ?? 0} photos`;
      }
      case 'member_join': {
        return `${name} joined as ${data.role ?? 'member'}`;
      }
      case 'member_leave': {
        return `${name} left the space`;
      }
      case 'member_remove': {
        return `${name} was removed`;
      }
      case 'member_role_change': {
        return `${name} changed role to ${data.newRole ?? 'member'}`;
      }
      case 'cover_change': {
        return `${name} set a new cover photo`;
      }
      case 'space_rename': {
        return `Renamed from "${data.oldName}" to "${data.newName}"`;
      }
      case 'space_color_change': {
        return 'Space color changed';
      }
      default: {
        return `${name} performed an action`;
      }
    }
  }

  function toAvatarUser(activity: SharedSpaceActivityResponseDto) {
    return {
      id: activity.userId ?? '',
      name: activity.userName ?? '',
      email: activity.userEmail ?? '',
      profileImagePath: activity.userProfileImagePath ?? '',
      avatarColor: (activity.userAvatarColor as UserAvatarColor) ?? UserAvatarColor.Primary,
      profileChangedAt: '',
    };
  }

  interface DayGroup {
    label: string;
    activities: SharedSpaceActivityResponseDto[];
  }

  let groupedByDay: DayGroup[] = $derived.by(() => {
    const groups: DayGroup[] = [];
    let currentLabel = '';
    let currentGroup: SharedSpaceActivityResponseDto[] = [];

    for (const activity of activities) {
      const label = getDayLabel(activity.createdAt);
      if (label === currentLabel) {
        currentGroup.push(activity);
      } else {
        if (currentGroup.length > 0) {
          groups.push({ label: currentLabel, activities: currentGroup });
        }
        currentLabel = label;
        currentGroup = [activity];
      }
    }

    if (currentGroup.length > 0) {
      groups.push({ label: currentLabel, activities: currentGroup });
    }

    return groups;
  });

  const spaceColorMap: Record<string, string> = {
    primary: 'bg-primary',
    pink: 'bg-pink-400',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    orange: 'bg-orange-600',
    gray: 'bg-gray-600',
    amber: 'bg-amber-600',
  };

  let dotColorClass = $derived(spaceColorMap[spaceColor] ?? 'bg-gray-400');
  let borderColorMap: Record<string, string> = {
    primary: 'border-primary',
    pink: 'border-pink-400',
    red: 'border-red-500',
    yellow: 'border-yellow-500',
    blue: 'border-blue-500',
    green: 'border-green-600',
    purple: 'border-purple-600',
    orange: 'border-orange-600',
    gray: 'border-gray-600',
    amber: 'border-amber-600',
  };
  let borderClass = $derived(borderColorMap[spaceColor] ?? 'border-gray-400');
</script>

{#if activities.length === 0}
  <div class="flex flex-col items-center justify-center px-6 py-12 text-center" data-testid="activity-empty-state">
    <p class="text-sm text-gray-500 dark:text-gray-400">No activity yet</p>
    <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
      Activity will appear here as members interact with the space
    </p>
  </div>
{:else}
  <div class="flex flex-col">
    {#each groupedByDay as group, groupIndex (group.label)}
      <!-- Day header -->
      <div
        class="sticky top-0 z-10 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 backdrop-blur-sm dark:bg-immich-dark-bg/90 dark:text-gray-400"
        data-testid="day-header-{groupIndex}"
      >
        {group.label}
      </div>

      {#each group.activities as activity (activity.id)}
        {#if HIGH_IMPACT_TYPES.has(activity.type)}
          <!-- High-impact: full card with avatar + thumbnail strip -->
          <div
            class="mx-3 mb-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50"
            data-testid="activity-item-{activity.id}"
          >
            <div class="flex items-start gap-3">
              <div class="shrink-0">
                <UserAvatar user={toAvatarUser(activity)} size="sm" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm">{getDescription(activity)}</p>
                <p class="mt-0.5 text-xs text-gray-400">{formatTimeAgo(activity.createdAt)}</p>
              </div>
            </div>
            {#if activity.type === 'asset_add'}
              {@const assetIds = ((activity.data as Record<string, unknown>).assetIds as string[]) ?? []}
              {#if assetIds.length > 0}
                <div class="mt-2 flex gap-1.5">
                  {#each assetIds.slice(0, 4) as assetId (assetId)}
                    <img
                      alt=""
                      src={getAssetMediaUrl({ id: assetId })}
                      class="h-8 w-8 rounded-md object-cover"
                      loading="lazy"
                      draggable="false"
                    />
                  {/each}
                  {#if assetIds.length > 4}
                    <div
                      class="flex h-8 w-8 items-center justify-center rounded-md bg-gray-200 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                    >
                      +{assetIds.length - 4}
                    </div>
                  {/if}
                </div>
              {/if}
            {/if}
          </div>
        {:else if MEDIUM_TYPES.has(activity.type)}
          <!-- Medium: row with avatar + left border accent -->
          <div
            class="mx-3 mb-2 flex items-center gap-3 border-l-2 {borderClass} py-2 pl-3 pr-2"
            data-testid="activity-item-{activity.id}"
          >
            <div class="shrink-0">
              <UserAvatar user={toAvatarUser(activity)} size="sm" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm">{getDescription(activity)}</p>
              <p class="mt-0.5 text-xs text-gray-400">{formatTimeAgo(activity.createdAt)}</p>
            </div>
          </div>
        {:else}
          <!-- Low: compact single line with small colored dot -->
          <div class="mx-3 mb-1 flex items-center gap-2 px-2 py-1.5" data-testid="activity-item-{activity.id}">
            <div class="h-2 w-2 shrink-0 rounded-full {dotColorClass}"></div>
            <p class="flex-1 truncate text-xs text-gray-500 dark:text-gray-400">
              {getDescription(activity)}
            </p>
            <span class="shrink-0 text-xs text-gray-400">{formatTimeAgo(activity.createdAt)}</span>
          </div>
        {/if}
      {/each}
    {/each}

    {#if hasMore}
      <div class="flex justify-center px-4 py-3" data-testid="load-more-button">
        <Button size="small" variant="ghost" color="secondary" leadingIcon={mdiChevronDown} onclick={onLoadMore}>
          Load more
        </Button>
      </div>
    {/if}
  </div>
{/if}
