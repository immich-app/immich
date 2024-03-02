<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import type { AlbumResponseDto, UserResponseDto } from '@immich/sdk';
  import { mdiClose, mdiPlus } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';

  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';

  export let album: AlbumResponseDto;
  export let user: UserResponseDto;

  const dispatch = createEventDispatcher<{
    close: void;
    toggleEnableActivity: void;
    showSelectSharedUser: void;
  }>();
</script>

<FullScreenModal on:clickOutside={() => dispatch('close')}>
  <div class="flex h-full w-full place-content-center place-items-center overflow-hidden p-2 md:p-0">
    <div
      class="w-[550px] rounded-3xl border bg-immich-bg shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg"
    >
      <div class="px-2 pt-2">
        <div class="flex items-center">
          <h1 class="px-4 w-full self-center font-medium text-immich-primary dark:text-immich-dark-primary">Options</h1>
          <div>
            <CircleIconButton icon={mdiClose} on:click={() => dispatch('close')} />
          </div>
        </div>

        <div class=" items-center justify-center p-4">
          <div class="py-2">
            <h2 class="text-gray text-sm mb-3">SHARING</h2>
            <div class="p-2">
              <SettingSwitch
                title="Comments & likes"
                subtitle="Let others respond"
                checked={album.isActivityEnabled}
                on:toggle={() => dispatch('toggleEnableActivity')}
              />
            </div>
          </div>
          <div class="py-2">
            <div class="text-gray text-sm mb-3">PEOPLE</div>
            <div class="p-2">
              <button class="flex items-center gap-2" on:click={() => dispatch('showSelectSharedUser')}>
                <div class="rounded-full w-10 h-10 border border-gray-500 flex items-center justify-center">
                  <div><Icon path={mdiPlus} size="25" /></div>
                </div>
                <div>Invite People</div>
              </button>
              <div class="flex items-center gap-2 py-2 mt-2">
                <div>
                  <UserAvatar {user} size="md" />
                </div>
                <div class="w-full">{user.name}</div>
                <div>Owner</div>
              </div>
              {#each album.sharedUsers as user (user.id)}
                <div class="flex items-center gap-2 py-2">
                  <div>
                    <UserAvatar {user} size="md" />
                  </div>
                  <div class="w-full">{user.name}</div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</FullScreenModal>
