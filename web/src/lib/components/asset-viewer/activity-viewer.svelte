<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import UserAvatar from '../shared-components/user-avatar.svelte';
  import { mdiClose, mdiHeart, mdiSend, mdiDotsVertical } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';
  import { ActivityReponseDto, api, type UserResponseDto } from '@api';
  import { handleError } from '$lib/utils/handle-error';
  import { isTenMinutesApart, timeSince } from '$lib/utils/timesince';
  import { clickOutside } from '$lib/utils/click-outside';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';

  export let reactions: ActivityReponseDto[];
  export let user: UserResponseDto;
  export let assetId: string;
  export let albumId: string;
  export let albumOwnerId: string;

  let textArea: HTMLTextAreaElement;
  let previousAssetId: string | null;

  $: {
    if (previousAssetId != assetId) {
      getReactions();
      previousAssetId = assetId;
    }
  }

  const getReactions = async () => {
    try {
      const { data } = await api.activityApi.getActivity({ id: assetId, albumId });
      reactions = data;
    } catch (error) {
      handleError(error, 'Error when fetching reactions');
    }
  };

  const handleEnter = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSendComment();
      return;
    }
  };

  const autoGrow = () => {
    textArea.style.height = '5px';
    textArea.style.height = textArea.scrollHeight + 'px';
  };

  const timeOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  } as Intl.DateTimeFormatOptions;

  $: showDeleteComment = Array(reactions.length).fill(false);
  let message = '';

  const dispatch = createEventDispatcher();

  const handleDeleteComment = async (id: string | null, index: number) => {
    if (id === null) {
      return;
    }
    try {
      await api.activityApi.deleteComment({ id });
      reactions.splice(index, 1);
      showDeleteComment.splice(index, 1);
      reactions = reactions;
      dispatch('deleteComment');
    } catch (error) {
      handleError(error, "Can't remove comment");
    }
  };

  const handleSendComment = async () => {
    if (!message) {
      return;
    }
    try {
      const { data } = await api.activityApi.addComment({
        activityCommentDto: { albumId: albumId, assetId: assetId, comment: message },
      });
      reactions.push(data);
      message = '';
      dispatch('addComment');
      // Re-render the activity feed
      reactions = reactions;
    } catch (error) {
      handleError(error, "Can't add your comment");
    }
  };

  const showOptionsMenu = (index: number) => {
    showDeleteComment[index] = !showDeleteComment[index];
  };
</script>

<div class="relative overflow-x-hidden">
  <div class=" dark:bg-immich-dark-bg dark:text-immich-dark-fg h-full overflow-x-hidden">
    <div class="fixed z-[1000] w-[359px] dark:bg-immich-dark-bg dark:text-immich-dark-fg p-2 bg-white">
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
    <div class="overflow-x-hidden mt-[64px] mb-[72px]">
      {#each reactions as reaction, index (reaction.id)}
        {#if reaction.user && reaction.createdAt}
          {#if reaction.isFavorite}
            <div
              class="flex p-2 m-2 rounded-full gap-2 items-center text-sm"
              title={new Date(reaction.createdAt).toLocaleDateString()}
            >
              <div class="text-red-600"><Icon path={mdiHeart} size={20} /></div>

              <div>
                {`${reaction.user.firstName} ${reaction.user.lastName} liked this asset `}&bull;{` ${timeSince(
                  new Date(reaction.createdAt),
                )}`}
              </div>
            </div>
          {/if}
          {#if reaction.comment}
            <div class="flex dark:bg-slate-500 bg-gray-200 p-2 m-2 rounded-3xl gap-2 justify-start">
              <div>
                <UserAvatar user={reaction.user} size="sm" />
              </div>

              <div class="w-full leading-4 flex items-center">{reaction.comment}</div>
              {#if (user && reaction.user && reaction.user.id === user.id) || (user && user.isAdmin) || albumOwnerId === user.id}
                <div class="flex items-start w-fit pt-[5px]">
                  <button on:click={() => (!showDeleteComment[index] ? showOptionsMenu(index) : '')}>
                    <Icon path={mdiDotsVertical} />
                  </button>
                </div>
              {/if}
              <div>
                {#if showDeleteComment[index]}
                  <button
                    class="absolute right-6 rounded-xl items-center p-2 text-black bg-gray-100"
                    use:clickOutside
                    on:outclick={() => (showDeleteComment[index] = false)}
                    on:click={() => handleDeleteComment(reaction.id, index)}
                  >
                    Delete Comment
                  </button>
                {/if}
              </div>
            </div>
            {#if (index > 0 && index != reactions.length - 1 && reactions[index].createdAt !== null && reactions[index + 1].createdAt !== null && isTenMinutesApart(reactions[index].createdAt, reactions[index + 1].createdAt)) || index === 0 || index === reactions.length - 1}
              <div
                class=" px-2 text-right w-full text-sm text-gray-500 dark:text-gray-300"
                title={new Date(reaction.createdAt).toLocaleDateString(undefined, timeOptions)}
              >
                {timeSince(new Date(reaction.createdAt))}
              </div>
            {/if}
          {/if}
        {/if}
      {/each}
    </div>
  </div>

  <div class="fixed bottom-0 w-[359px] overflow-x-hidden">
    <div class="flex items-center justify-center p-2">
      <div class="flex p-2 bg-slate-400 h-fit dark:bg-gray-900 rounded-3xl gap-2 w-full text-white">
        <div>
          <UserAvatar {user} size="md" showTitle={false} />
        </div>
        <form class="flex w-full max-h-56 gap-1" on:submit|preventDefault={() => handleSendComment()}>
          <div class="flex w-full items-center">
            <textarea
              bind:this={textArea}
              bind:value={message}
              placeholder="Say something"
              on:input={autoGrow}
              on:keypress={handleEnter}
              class=" h-[18px] w-full max-h-56 pr-2 items-center overflow-y-auto leading-4 outline-none resize-none bg-slate-400 dark:bg-gray-900 text-white"
            />
          </div>
          {#if message}
            <div class="flex items-end w-fit ml-0">
              <CircleIconButton size="15" icon={mdiSend} />
            </div>
          {/if}
        </form>
      </div>
    </div>
  </div>
</div>

<style>
  ::placeholder {
    color: white;
    opacity: 0.6;
  }

  ::-ms-input-placeholder {
    /* Edge 12 -18 */
    color: white;
  }
</style>
