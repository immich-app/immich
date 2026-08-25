<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/ButtonContextMenu.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/MenuOption.svelte';
  import { timeBeforeShowLoadingSpinner } from '$lib/constants';
  import { activityManager } from '$lib/managers/activity-manager.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { Route } from '$lib/route';
  import { locale } from '$lib/stores/preferences.store';
  import { getAssetMediaUrl } from '$lib/utils';
  import { getGroupMediaType, groupActivities } from '$lib/utils/activity';
  import { getAssetType } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { isTenMinutesApart } from '$lib/utils/timesince';
  import { AssetTypeEnum, ReactionType, type ActivityResponseDto, type AlbumUserResponseDto } from '@immich/sdk';
  import { Icon, IconButton, LoadingSpinner, Textarea, toastManager } from '@immich/ui';
  import { mdiClose, mdiDeleteOutline, mdiDotsVertical, mdiPlayCircleOutline, mdiSend, mdiThumbUp } from '@mdi/js';
  import * as luxon from 'luxon';
  import { t } from 'svelte-i18n';
  import { fromAction } from 'svelte/attachments';
  import { SvelteSet } from 'svelte/reactivity';
  import UserAvatar from '../shared-components/UserAvatar.svelte';

  const units: Intl.RelativeTimeFormatUnit[] = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'];

  const shouldGroup = (currentDate: string, nextDate: string): boolean => {
    const currentDateTime = luxon.DateTime.fromISO(currentDate, { locale: $locale });
    const nextDateTime = luxon.DateTime.fromISO(nextDate, { locale: $locale });

    return currentDateTime.hasSame(nextDateTime, 'hour') || currentDateTime.toRelative() === nextDateTime.toRelative();
  };

  const timeSince = (dateTime: luxon.DateTime) => {
    const diff = dateTime.diffNow().shiftTo(...units);
    const unit = units.find((unit) => diff.get(unit) !== 0) || 'second';

    const relativeFormatter = new Intl.RelativeTimeFormat($locale, {
      numeric: 'auto',
    });
    return relativeFormatter.format(Math.trunc(diff.as(unit)), unit);
  };

  interface Props {
    assetId?: string | undefined;
    albumId: string;
    assetType?: AssetTypeEnum | undefined;
    albumUsers: AlbumUserResponseDto[];
    disabled: boolean;
  }

  let { assetId = undefined, albumId, assetType = undefined, albumUsers, disabled }: Props = $props();

  let innerHeight: number = $state(0);
  let activityHeight: number = $state(0);
  let chatHeight: number = $state(0);
  let divHeight = $derived(innerHeight - activityHeight);
  let previousAssetId: string | undefined = $state(assetId);
  let message = $state('');
  let isSendingMessage = $state(false);
  const isAlbumOwner = $derived(albumUsers[0].user.id === authManager.user.id);

  const timeOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };

  const handleDeleteReaction = async (reaction: ActivityResponseDto) => {
    try {
      await activityManager.deleteActivity(reaction);

      const deleteMessages: Partial<Record<ReactionType, string>> = {
        [ReactionType.Comment]: $t('comment_deleted'),
        [ReactionType.Like]: $t('like_deleted'),
      };
      const deletedMessage = deleteMessages[reaction.type];
      if (deletedMessage) {
        toastManager.primary(deletedMessage);
      }
    } catch (error) {
      handleError(error, $t('errors.unable_to_remove_reaction'));
    }
  };

  const handleSendComment = async () => {
    if (!message) {
      return;
    }
    const timeout = setTimeout(() => (isSendingMessage = true), timeBeforeShowLoadingSpinner);
    try {
      await activityManager.addActivity({ albumId, assetId, type: ReactionType.Comment, comment: message });

      message = '';
    } catch (error) {
      handleError(error, $t('errors.unable_to_add_comment'));
    } finally {
      clearTimeout(timeout);
    }
    isSendingMessage = false;
  };

  $effect(() => {
    if (assetId && previousAssetId !== assetId) {
      previousAssetId = assetId;
    }
  });

  const onsubmit = async (event: Event) => {
    event.preventDefault();
    await handleSendComment();
  };

  const MAX_GROUP_THUMBNAILS = 10;
  const expandedGroups = new SvelteSet<string>();
  const groups = $derived(groupActivities(activityManager.activities));
  const showTimestamp = (index: number, apart: (current: string, next: string) => boolean): boolean =>
    index === groups.length - 1 || apart(groups[index][0].createdAt, groups[index + 1][0].createdAt);
</script>

{#snippet timestampFooter(createdAt: string, show: boolean)}
  {#if show}
    <div
      class="w-full px-2 pt-1 text-right text-sm text-gray-500 dark:text-gray-300"
      title={new Date(createdAt).toLocaleDateString($locale, timeOptions)}
    >
      {timeSince(luxon.DateTime.fromISO(createdAt, { locale: $locale }))}
    </div>
  {/if}
{/snippet}

{#snippet groupThumbnail(assetId: string, assetType: AssetTypeEnum | null | undefined, name: string)}
  <img
    class="size-full rounded-lg object-cover"
    src={getAssetMediaUrl({ id: assetId })}
    alt={$t('asset_added_by', { values: { user: name } })}
  />
  {#if assetType === AssetTypeEnum.Video}
    <div class="absolute inset-e-0 top-0 pe-1 pt-1 text-white drop-shadow-[1px_1px_6px_rgb(0_0_0)]">
      <Icon icon={mdiPlayCircleOutline} size="20" />
    </div>
  {/if}
{/snippet}

<div class="relative h-full overflow-y-hidden border-l border-subtle bg-subtle" bind:offsetHeight={innerHeight}>
  <div class="size-full">
    <div class="flex h-fit w-full bg-subtle p-2 dark:text-immich-dark-fg" bind:clientHeight={activityHeight}>
      <div class="flex place-items-center gap-2">
        <IconButton
          shape="round"
          variant="ghost"
          color="secondary"
          onclick={() => assetViewerManager.closeActivityPanel()}
          icon={mdiClose}
          aria-label={$t('close')}
        />

        <p class="text-lg text-immich-fg dark:text-immich-dark-fg">{$t('activity')}</p>
      </div>
    </div>
    {#if innerHeight}
      <div
        class="relative w-full immich-scrollbar overflow-y-auto px-2"
        style="height: {divHeight}px;padding-bottom: {chatHeight}px"
      >
        {#each groups as group, index (group[0].id)}
          {@const item = group[0]}
          {#if item.type === ReactionType.Comment}
            <div class="mt-3 flex justify-start gap-4 rounded-lg bg-gray-200 py-3 ps-3 dark:bg-gray-800">
              <div class="flex items-center">
                <UserAvatar user={item.user} size="sm" />
              </div>

              <div class="w-full self-center overflow-hidden text-sm/4 wrap-break-word">{item.comment}</div>
              {#if assetId === undefined && item.assetId}
                <a class="aspect-square size-19" href={Route.viewAlbumAsset({ albumId, assetId: item.assetId })}>
                  <img
                    class="size-19 rounded-lg object-cover"
                    src={getAssetMediaUrl({ id: item.assetId })}
                    alt="Profile picture of {item.user.name}, who commented on this asset"
                  />
                </a>
              {/if}
              {#if item.user.id === authManager.user.id || isAlbumOwner}
                <div class="me-4">
                  <ButtonContextMenu
                    icon={mdiDotsVertical}
                    title={$t('comment_options')}
                    align="top-right"
                    direction="left"
                    size="small"
                  >
                    <MenuOption
                      activeColor="bg-red-200"
                      icon={mdiDeleteOutline}
                      text={$t('remove')}
                      onClick={() => handleDeleteReaction(item)}
                    />
                  </ButtonContextMenu>
                </div>
              {/if}
            </div>

            {@render timestampFooter(
              item.createdAt,
              showTimestamp(index, (current, next) => !shouldGroup(current, next)),
            )}
          {:else if item.type === ReactionType.Like}
            <div class="relative">
              <div class="mt-3 flex items-center gap-4 py-3 ps-3 text-sm">
                <div class="text-primary"><Icon icon={mdiThumbUp} size="20" /></div>

                <div class="w-full" title={`${item.user.name} (${item.user.email})`}>
                  {$t('user_liked', {
                    values: {
                      user: item.user.name,
                      type: assetType ? getAssetType(assetType).toLowerCase() : null,
                    },
                  })}
                </div>
                {#if assetId === undefined && item.assetId}
                  <a class="aspect-square size-19" href={Route.viewAlbumAsset({ albumId, assetId: item.assetId })}>
                    <img
                      class="size-19 rounded-lg object-cover"
                      src={getAssetMediaUrl({ id: item.assetId })}
                      alt="Profile picture of {item.user.name}, who liked this asset"
                    />
                  </a>
                {/if}
                {#if item.user.id === authManager.user.id || isAlbumOwner}
                  <div class="me-4">
                    <ButtonContextMenu
                      icon={mdiDotsVertical}
                      title={$t('reaction_options')}
                      align="top-right"
                      direction="left"
                      size="small"
                    >
                      <MenuOption
                        activeColor="bg-red-200"
                        icon={mdiDeleteOutline}
                        text={$t('remove')}
                        onClick={() => handleDeleteReaction(item)}
                      />
                    </ButtonContextMenu>
                  </div>
                {/if}
              </div>
              {@render timestampFooter(item.createdAt, showTimestamp(index, isTenMinutesApart))}
            </div>
          {:else if item.type === ReactionType.AssetAdded}
            {@const addedBy = item.user}
            <div class="relative">
              <div class="mt-3 flex items-center gap-4 py-3 ps-3 text-sm">
                <div class="flex items-center">
                  <UserAvatar user={addedBy} size="sm" />
                </div>
                <div class="w-full" title={`${addedBy.name} (${addedBy.email})`}>
                  {$t('user_added_assets', {
                    values: { user: addedBy.name, count: group.length, type: getGroupMediaType(group) },
                  })}
                </div>
              </div>
              {#if assetId === undefined}
                <!-- the +N overlay covers the last visible tile, so that asset counts as hidden too -->
                {@const isExpanded = expandedGroups.has(item.id)}
                {@const hasMore = !isExpanded && group.length > MAX_GROUP_THUMBNAILS}
                {@const visibleAssets = isExpanded ? group : group.slice(0, MAX_GROUP_THUMBNAILS)}
                {@const hiddenCount = group.length - (MAX_GROUP_THUMBNAILS - 1)}
                <div class="flex flex-wrap gap-1 ps-3 pb-2">
                  {#each visibleAssets as activity, i (activity.id)}
                    {#if activity.assetId}
                      {#if hasMore && i === MAX_GROUP_THUMBNAILS - 1}
                        <button
                          type="button"
                          class="relative aspect-square size-19 cursor-pointer"
                          onclick={() => expandedGroups.add(item.id)}
                        >
                          {@render groupThumbnail(activity.assetId, activity.assetType, addedBy.name)}
                          <div
                            class="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60 text-sm font-semibold text-white"
                          >
                            +{hiddenCount}
                          </div>
                        </button>
                      {:else}
                        <a
                          class="relative aspect-square size-19"
                          href={Route.viewAlbumAsset({ albumId, assetId: activity.assetId })}
                        >
                          {@render groupThumbnail(activity.assetId, activity.assetType, addedBy.name)}
                        </a>
                      {/if}
                    {/if}
                  {/each}
                </div>
              {/if}
              {@render timestampFooter(item.createdAt, showTimestamp(index, isTenMinutesApart))}
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>

  <div class="absolute bottom-0 w-full">
    <div class="flex items-center justify-center p-2" bind:clientHeight={chatHeight}>
      <div class="flex h-fit w-full gap-4 rounded-3xl bg-gray-200 p-2 text-immich-dark-gray">
        <div>
          <UserAvatar user={authManager.user} size="md" noTitle />
        </div>
        <form class="flex max-h-56 w-full items-center gap-1" {onsubmit}>
          <Textarea
            {disabled}
            bind:value={message}
            rows={1}
            grow
            placeholder={disabled ? $t('comments_are_disabled') : $t('say_something')}
            {@attach fromAction(shortcut, () => ({
              shortcut: { key: 'Enter' },
              onShortcut: () => handleSendComment(),
            }))}
            class="{disabled
              ? 'cursor-not-allowed'
              : ''} max-h-56 w-full resize-none items-center overflow-y-auto bg-gray-200 pe-2 leading-4 ring-0! outline-none dark:bg-gray-200"
          />
          {#if isSendingMessage}
            <div class="ms-0 flex place-items-center pb-2">
              <div class="flex w-full place-items-center">
                <LoadingSpinner size="large" />
              </div>
            </div>
          {:else if message}
            <div class="light ms-0 flex w-fit items-center">
              <IconButton
                shape="round"
                aria-label={$t('send_message')}
                variant="ghost"
                icon={mdiSend}
                onclick={() => handleSendComment()}
              />
            </div>
          {/if}
        </form>
      </div>
    </div>
  </div>
</div>

<style>
  ::placeholder {
    color: rgb(60, 60, 60);
    opacity: 0.6;
  }

  ::-ms-input-placeholder {
    /* Edge 12 -18 */
    color: white;
  }
</style>
