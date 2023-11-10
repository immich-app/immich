<script lang="ts">
  import { PartnerResponseDto, UserResponseDto, api } from '@api';
  import UserAvatar from '../shared-components/user-avatar.svelte';
  import Button from '../elements/buttons/button.svelte';
  import PartnerSelectionModal from './partner-selection-modal.svelte';
  import { handleError } from '../../utils/handle-error';
  import ConfirmDialogue from '../shared-components/confirm-dialogue.svelte';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import { mdiCheck, mdiClose } from '@mdi/js';
  import { onMount } from 'svelte';
  import Icon from '../elements/icon.svelte';
  import SettingSwitch from '../admin-page/settings/setting-switch.svelte';

  export let user: UserResponseDto;

  let createPartner = false;
  let removePartner: PartnerResponseDto | null = null;

  let currentPartners = {
    all: [] as Array<PartnerResponseDto>,
    sharedByMe: [] as Array<PartnerResponseDto>,
    sharedWithMe: [] as Array<PartnerResponseDto>,
  };

  onMount(() => {
    refreshPartners();
  });

  const refreshPartners = async () => {
    currentPartners.all = [];
    currentPartners.sharedByMe = [];
    currentPartners.sharedWithMe = [];

    const [{ data: sharedBy }, { data: sharedWith }] = await Promise.all([
      api.partnerApi.getPartners({ direction: 'shared-by' }),
      api.partnerApi.getPartners({ direction: 'shared-with' }),
    ]);

    // It is important to put sharedWith first, otherwise the state won't be updated correctly
    // for the inTimeline update call.
    currentPartners.all = [...sharedWith, ...sharedBy]
      .filter((partner, index, self) => self.findIndex((p) => p.id === partner.id) === index)
      .sort((a, b) => a.firstName.localeCompare(b.firstName));
    currentPartners.sharedByMe = sharedBy;
    currentPartners.sharedWithMe = sharedWith;
  };

  const handleRemovePartner = async () => {
    if (!removePartner) {
      return;
    }

    try {
      await api.partnerApi.removePartner({ id: removePartner.id });
      removePartner = null;
      await refreshPartners();
    } catch (error) {
      handleError(error, 'Unable to remove partner');
    }
  };

  const handleCreatePartners = async (users: UserResponseDto[]) => {
    try {
      for (const user of users) {
        await api.partnerApi.createPartner({ id: user.id });
      }

      await refreshPartners();
      createPartner = false;
    } catch (error) {
      handleError(error, 'Unable to add partners');
    }
  };

  const handleShowOnTimelineChanged = async (sharedById: string, value: boolean) => {
    try {
      await api.partnerApi.updatePartner({ id: sharedById, updatePartnerDto: { inTimeline: value } });

      currentPartners.sharedWithMe = currentPartners.sharedWithMe.map((partner) => {
        if (partner.id === sharedById) {
          return { ...partner, inTimeline: value };
        }

        return partner;
      });
    } catch (error) {
      handleError(error, 'Unable to add partners');
    }
  };
</script>

<section class="my-4">
  {#if currentPartners.all.length > 0}
    {#each currentPartners.all as partner (partner.id)}
      {@const isSharedByMe = currentPartners.sharedByMe.some((p) => p.id === partner.id)}
      {@const isSharedWithMe = currentPartners.sharedWithMe.some((p) => p.id === partner.id)}

      <div class="rounded-2xl border border-gray-200 dark:border-gray-800 mt-6 bg-slate-50 dark:bg-gray-900 p-5">
        <div class="flex gap-4 rounded-lg pb-4 transition-all justify-between">
          <div class="flex gap-4">
            <UserAvatar user={partner} size="md" autoColor />
            <div class="text-left">
              <p class="text-immich-fg dark:text-immich-dark-fg">
                {partner.firstName}
                {partner.lastName}
              </p>
              <p class="text-xs text-immich-fg/75 dark:text-immich-dark-fg/75">
                {partner.email}
              </p>
            </div>
          </div>

          <CircleIconButton
            on:click={() => (removePartner = partner)}
            icon={mdiClose}
            size={'16'}
            title="Stop sharing your photos with this user"
          />
        </div>

        <div class="dark:text-gray-200 text-immich-dark-gray">
          <!-- I am sharing my assets with this user -->
          {#if isSharedByMe}
            <hr class="my-4 border border-gray-200 dark:border-gray-700" />
            <p class="text-xs font-medium my-4">SHARED WITH {partner.firstName.toUpperCase()}</p>
            <p class="text-md">{partner.firstName} can access</p>
            <ul class="text-sm">
              <li class="flex gap-2 place-items-center py-1 mt-2">
                <Icon path={mdiCheck} /> All your photos and videos except those in Archived and Deleted
              </li>
              <li class="flex gap-2 place-items-center py-1">
                <Icon path={mdiCheck} /> The location where your photos were taken
              </li>
            </ul>
          {/if}

          <!-- this user is sharing assets with me -->
          {#if isSharedWithMe}
            <hr class="my-4 border border-gray-200 dark:border-gray-700" />
            <p class="text-xs font-medium my-4">PHOTOS FROM {partner.firstName.toUpperCase()}</p>
            <SettingSwitch
              title="Show in timeline"
              subtitle="Show photos and videos from this user in your timeline"
              bind:checked={partner.inTimeline}
              on:toggle={({ detail }) => handleShowOnTimelineChanged(partner.id, detail)}
            />
          {/if}
        </div>
      </div>
    {/each}
  {/if}

  <div class="flex justify-end mt-5">
    <Button size="sm" on:click={() => (createPartner = true)}>Add partner</Button>
  </div>
</section>

{#if createPartner}
  <PartnerSelectionModal
    {user}
    on:close={() => (createPartner = false)}
    on:add-users={(event) => handleCreatePartners(event.detail)}
  />
{/if}

{#if removePartner}
  <ConfirmDialogue
    title="Stop sharing your photos?"
    prompt="{removePartner.firstName} will no longer be able to access your photos."
    on:cancel={() => (removePartner = null)}
    on:confirm={() => handleRemovePartner()}
  />
{/if}
