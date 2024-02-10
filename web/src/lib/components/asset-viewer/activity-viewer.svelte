<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import UserAvatar from '../shared-components/user-avatar.svelte';
  import { mdiClose, mdiHeart, mdiSend, mdiDotsVertical } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';
  import {
    type ActivityResponseDto,
    api,
    AssetTypeEnum,
    ReactionType,
    ThumbnailFormat,
    type UserResponseDto,
  } from '@api';
  import { handleError } from '$lib/utils/handle-error';
  import { isTenMinutesApart } from '$lib/utils/timesince';
  import { clickOutside } from '$lib/utils/click-outside';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';
  import { getAssetType } from '$lib/utils/asset-utils';
  import * as luxon from 'luxon';
  import { timeBeforeShowLoadingSpinner } from '$lib/constants';
  import { autoGrowHeight } from '$lib/utils/autogrow';

  const units: Intl.RelativeTimeFormatUnit[] = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'];

  const shouldGroup = (currentDate: string, nextDate: string): boolean => {
    const currentDateTime = luxon.DateTime.fromISO(currentDate);
    const nextDateTime = luxon.DateTime.fromISO(nextDate);

    return currentDateTime.hasSame(nextDateTime, 'hour') || currentDateTime.toRelative() === nextDateTime.toRelative();
  };

  const timeSince = (dateTime: luxon.DateTime) => {
    const diff = dateTime.diffNow().shiftTo(...units);
    const unit = units.find((unit) => diff.get(unit) !== 0) || 'second';

    const relativeFormatter = new Intl.RelativeTimeFormat('en', {
      numeric: 'auto',
    });
    return relativeFormatter.format(Math.trunc(diff.as(unit)), unit);
  };

  export let reactions: ActivityResponseDto[];
  export let user: UserResponseDto;
  export let assetId: string | undefined = undefined;
  export let albumId: string;
  export let assetType: AssetTypeEnum | undefined = undefined;
  export let albumOwnerId: string;
  export let disabled: boolean;
  export let isLiked: ActivityResponseDto | null;

  let textArea: HTMLTextAreaElement;
  let innerHeight: number;
  let activityHeight: number;
  let chatHeight: number;
  let divHeight: number;
  let previousAssetId: string | undefined = assetId;
  let message = '';
  let isSendingMessage = false;

  const dispatch = createEventDispatcher<{
    deleteComment: void;
    deleteLike: void;
    addComment: void;
    close: void;
  }>();

  $: showDeleteReaction = Array.from({ length: reactions.length }).fill(false);
  $: {
    if (innerHeight && activityHeight) {
      divHeight = innerHeight - activityHeight;
    }
  }

  $: {
    if (assetId && previousAssetId != assetId) {
      getReactions();
      previousAssetId = assetId;
    }
  }
  onMount(async () => {
    await getReactions();
  });

  const getReactions = async () => {
    try {
      const { data } = await api.activityApi.getActivities({ assetId, albumId });
      reactions = data;
    } catch (error) {
      handleError(error, 'Error when fetching reactions');
    }
  };

  const handleEnter = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSendComment();
      return;
    }
  };

  const timeOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  } as Intl.DateTimeFormatOptions;

  const handleDeleteReaction = async (reaction: ActivityResponseDto, index: number) => {
    try {
      await api.activityApi.deleteActivity({ id: reaction.id });
      reactions.splice(index, 1);
      showDeleteReaction.splice(index, 1);
      reactions = reactions;
      if (isLiked && reaction.type === 'like' && reaction.id == isLiked.id) {
        dispatch('deleteLike');
      } else {
        dispatch('deleteComment');
      }
      notificationController.show({
        message: `${reaction.type} deleted`,
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, `Can't remove ${reaction.type}`);
    }
  };

  const handleSendComment = async () => {
    if (!message) {
      return;
    }
    const timeout = setTimeout(() => (isSendingMessage = true), timeBeforeShowLoadingSpinner);
    try {
      const { data } = await api.activityApi.createActivity({
        activityCreateDto: { albumId, assetId, type: ReactionType.Comment, comment: message },
      });
      reactions.push(data);
      textArea.style.height = '18px';
      message = '';
      dispatch('addComment');
      // Re-render the activity feed
      reactions = reactions;
    } catch (error) {
      handleError(error, "Can't add your comment");
    } finally {
      clearTimeout(timeout);
    }
    isSendingMessage = false;
  };

  const showOptionsMenu = (index: number) => {
    showDeleteReaction[index] = !showDeleteReaction[index];
  };
</script>

<div class="overflow-y-hidden relative h-full" bind:offsetHeight={innerHeight}>
  <div class="dark:bg-immich-dark-bg dark:text-immich-dark-fg w-full h-full">
    <div
      class="flex w-full h-fit dark:bg-immich-dark-bg dark:text-immich-dark-fg p-2 bg-white"
      bind:clientHeight={activityHeight}
    >
      <div class="flex place-items-center gap-2">
        <button
          class="flex place-content-center place-items-center rounded-full p-3 transition-colors hover:bg-gray-200 dark:text-immich-dark-fg dark:hover:bg-gray-900"
          on:click={() => dispatch('close')}
        >
          <Icon path={mdiClose} size="24" />
        </button>

        <p class="text-lg text-immich-fg dark:text-immich-dark-fg">Activity</p>
      </div>
    </div>
    {#if innerHeight}
      <div
        class="overflow-y-auto immich-scrollbar relative w-full px-2"
        style="height: {divHeight}px;padding-bottom: {chatHeight}px"
      >
        {#each reactions as reaction, index (reaction.id)}
          {#if reaction.type === 'comment'}
            <div class="flex dark:bg-gray-800 bg-gray-200 py-3 pl-3 mt-3 rounded-lg gap-4 justify-start">
              <div class="flex items-center">
                <UserAvatar user={reaction.user} size="sm" />
              </div>

              <div class="w-full leading-4 overflow-hidden self-center break-words text-sm">{reaction.comment}</div>
              {#if assetId === undefined && reaction.assetId}
                <div class="aspect-square w-[75px] h-[75px]">
                  <img
                    class="rounded-lg w-[75px] h-[75px] object-cover"
                    src={api.getAssetThumbnailUrl(reaction.assetId, ThumbnailFormat.Webp)}
                    alt="comment-thumbnail"
                  />
                </div>
              {/if}
              {#if reaction.user.id === user.id || albumOwnerId === user.id}
                <div class="flex items-start w-fit pt-[5px]" title="Delete comment">
                  <button on:click={() => (showDeleteReaction[index] ? '' : showOptionsMenu(index))}>
                    <Icon path={mdiDotsVertical} />
                  </button>
                </div>
              {/if}
              <div>
                {#if showDeleteReaction[index]}
                  <button
                    class="absolute right-6 rounded-xl items-center bg-gray-300 dark:bg-slate-100 py-3 px-6 text-left text-sm font-medium text-immich-fg hover:bg-red-300 focus:outline-none focus:ring-2 focus:ring-inset dark:text-immich-dark-bg dark:hover:bg-red-100 transition-colors"
                    use:clickOutside
                    on:outclick={() => (showDeleteReaction[index] = false)}
                    on:click={() => handleDeleteReaction(reaction, index)}
                  >
                    Remove
                  </button>
                {/if}
              </div>
            </div>

            {#if (index != reactions.length - 1 && !shouldGroup(reactions[index].createdAt, reactions[index + 1].createdAt)) || index === reactions.length - 1}
              <div
                class="pt-1 px-2 text-right w-full text-sm text-gray-500 dark:text-gray-300"
                title={new Date(reaction.createdAt).toLocaleDateString(undefined, timeOptions)}
              >
                {timeSince(luxon.DateTime.fromISO(reaction.createdAt))}
              </div>
            {/if}
          {:else if reaction.type === 'like'}
            <div class="relative">
              <div class="flex py-3 pl-3 mt-3 gap-4 items-center text-sm">
                <div class="text-red-600"><Icon path={mdiHeart} size={20} /></div>

                <div class="w-full" title={`${reaction.user.name} (${reaction.user.email})`}>
                  {`${reaction.user.name} liked ${assetType ? `this ${getAssetType(assetType).toLowerCase()}` : 'it'}`}
                </div>
                {#if assetId === undefined && reaction.assetId}
                  <div class="aspect-square w-[75px] h-[75px]">
                    <img
                      class="rounded-lg w-[75px] h-[75px] object-cover"
                      src={api.getAssetThumbnailUrl(reaction.assetId, ThumbnailFormat.Webp)}
                      alt="like-thumbnail"
                    />
                  </div>
                {/if}
                {#if reaction.user.id === user.id || albumOwnerId === user.id}
                  <div class="flex items-start w-fit" title="Delete like">
                    <button on:click={() => (showDeleteReaction[index] ? '' : showOptionsMenu(index))}>
                      <Icon path={mdiDotsVertical} />
                    </button>
                  </div>
                {/if}
                <div>
                  {#if showDeleteReaction[index]}
                    <button
                      class="absolute right-6 rounded-xl items-center bg-gray-300 dark:bg-slate-100 py-3 px-6 text-left text-sm font-medium text-immich-fg hover:bg-red-300 focus:outline-none focus:ring-2 focus:ring-inset dark:text-immich-dark-bg dark:hover:bg-red-100 transition-colors"
                      use:clickOutside
                      on:outclick={() => (showDeleteReaction[index] = false)}
                      on:click={() => handleDeleteReaction(reaction, index)}
                    >
                      Remove
                    </button>
                  {/if}
                </div>
              </div>
              {#if (index != reactions.length - 1 && isTenMinutesApart(reactions[index].createdAt, reactions[index + 1].createdAt)) || index === reactions.length - 1}
                <div
                  class="pt-1 px-2 text-right w-full text-sm text-gray-500 dark:text-gray-300"
                  title={new Date(reaction.createdAt).toLocaleDateString(navigator.language, timeOptions)}
                >
                  {timeSince(luxon.DateTime.fromISO(reaction.createdAt))}
                </div>
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>

  <div class="absolute w-full bottom-0">
    <div class="flex items-center justify-center p-2" bind:clientHeight={chatHeight}>
      <div class="flex p-2 gap-4 h-fit bg-gray-200 text-immich-dark-gray rounded-3xl w-full">
        <div>
          <UserAvatar {user} size="md" showTitle={false} />
        </div>
        <form class="flex w-full max-h-56 gap-1" on:submit|preventDefault={() => handleSendComment()}>
          <div class="flex w-full items-center gap-4">
            <textarea
              {disabled}
              bind:this={textArea}
              bind:value={message}
              placeholder={disabled ? 'Comments are disabled' : 'Say something'}
              on:input={() => autoGrowHeight(textArea)}
              on:keypress={handleEnter}
              class="h-[18px] {disabled
                ? 'cursor-not-allowed'
                : ''} w-full max-h-56 pr-2 items-center overflow-y-auto leading-4 outline-none resize-none bg-gray-200"
            />
          </div>
          {#if isSendingMessage}
            <div class="flex items-end place-items-center pb-2 ml-0">
              <div class="flex w-full place-items-center">
                <LoadingSpinner />
              </div>
            </div>
          {:else if message}
            <div class="flex items-end w-fit ml-0">
              <CircleIconButton size="15" icon={mdiSend} iconColor={'dark'} hoverColor={'rgb(173,203,250)'} />
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
