<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { type AlbumResponseDto, type UserResponseDto } from '@immich/sdk';
  import { mdiPlus } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
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

<FullScreenModal id="album-options-modal" title="Options" onClose={() => dispatch('close')}>
  <div class="items-center justify-center">
    <div class="py-2">
      <h2 class="text-gray text-sm mb-2">SETTINGS</h2>
      <div class="grid p-2 gap-y-2">
        <SettingSwitch
          id="comments-likes"
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
</FullScreenModal>
