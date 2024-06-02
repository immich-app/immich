<script lang="ts">
  import {
    createPartner,
    getPartners,
    removePartner,
    updatePartner,
    type PartnerResponseDto,
    type UserResponseDto,
  } from '@immich/sdk';
  import { mdiCheck, mdiClose } from '@mdi/js';
  import { onMount } from 'svelte';
  import { handleError } from '../../utils/handle-error';
  import Button from '../elements/buttons/button.svelte';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import Icon from '../elements/icon.svelte';
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import PartnerSelectionModal from './partner-selection-modal.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';

  interface PartnerSharing {
    user: UserResponseDto;
    sharedByMe: boolean;
    sharedWithMe: boolean;
    inTimeline: boolean;
  }

  export let user: UserResponseDto;

  let createPartnerFlag = false;
  // let removePartnerDto: PartnerResponseDto | null = null;
  let partners: Array<PartnerSharing> = [];

  onMount(async () => {
    await refreshPartners();
  });

  const refreshPartners = async () => {
    partners = [];

    const [sharedBy, sharedWith] = await Promise.all([
      getPartners({ direction: 'shared-by' }),
      getPartners({ direction: 'shared-with' }),
    ]);

    for (const candidate of sharedBy) {
      partners = [
        ...partners,
        {
          user: candidate,
          sharedByMe: true,
          sharedWithMe: false,
          inTimeline: candidate.inTimeline ?? false,
        },
      ];
    }

    for (const candidate of sharedWith) {
      const existIndex = partners.findIndex((p) => candidate.id === p.user.id);

      if (existIndex >= 0) {
        partners[existIndex].sharedWithMe = true;
        partners[existIndex].inTimeline = candidate.inTimeline ?? false;
      } else {
        partners = [
          ...partners,
          {
            user: candidate,
            sharedByMe: false,
            sharedWithMe: true,
            inTimeline: candidate.inTimeline ?? false,
          },
        ];
      }
    }
  };

  const handleRemovePartner = async (partner: PartnerResponseDto) => {
    const isConfirmed = await dialogController.show({
      id: 'remove-partner',
      title: 'Stop sharing your photos?',
      prompt: `${partner.name} will no longer be able to access your photos.`,
    });

    if (!isConfirmed) {
      return;
    }

    try {
      await removePartner({ id: partner.id });
      await refreshPartners();
    } catch (error) {
      handleError(error, 'Unable to remove partner');
    }
  };

  const handleCreatePartners = async (users: UserResponseDto[]) => {
    try {
      for (const user of users) {
        await createPartner({ id: user.id });
      }

      await refreshPartners();
      createPartnerFlag = false;
    } catch (error) {
      handleError(error, 'Unable to add partners');
    }
  };

  const handleShowOnTimelineChanged = async (partner: PartnerSharing, inTimeline: boolean) => {
    try {
      await updatePartner({ id: partner.user.id, updatePartnerDto: { inTimeline } });

      partner.inTimeline = inTimeline;
      partners = partners;
    } catch (error) {
      handleError(error, 'Unable to update timeline display status');
    }
  };
</script>

<section class="my-4">
  {#if partners.length > 0}
    {#each partners as partner (partner.user.id)}
      <div class="rounded-2xl border border-gray-200 dark:border-gray-800 mt-6 bg-slate-50 dark:bg-gray-900 p-5">
        <div class="flex gap-4 rounded-lg pb-4 transition-all justify-between">
          <div class="flex gap-4">
            <UserAvatar user={partner.user} size="md" />
            <div class="text-left">
              <p class="text-immich-fg dark:text-immich-dark-fg">
                {partner.user.name}
              </p>
              <p class="text-sm text-immich-fg/75 dark:text-immich-dark-fg/75">
                {partner.user.email}
              </p>
            </div>
          </div>

          {#if partner.sharedByMe}
            <CircleIconButton
              on:click={() => handleRemovePartner(partner.user)}
              icon={mdiClose}
              size={'16'}
              title="Stop sharing your photos with this user"
            />
          {/if}
        </div>

        <div class="dark:text-gray-200 text-immich-dark-gray">
          <!-- I am sharing my assets with this user -->
          {#if partner.sharedByMe}
            <hr class="my-4 border border-gray-200 dark:border-gray-700" />
            <p class="text-xs font-medium my-4">SHARED WITH {partner.user.name.toUpperCase()}</p>
            <p class="text-md">{partner.user.name} can access</p>
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
          {#if partner.sharedWithMe}
            <hr class="my-4 border border-gray-200 dark:border-gray-700" />
            <p class="text-xs font-medium my-4">PHOTOS FROM {partner.user.name.toUpperCase()}</p>
            <SettingSwitch
              title="Show in timeline"
              subtitle="Show photos and videos from this user in your timeline"
              bind:checked={partner.inTimeline}
              on:toggle={({ detail }) => handleShowOnTimelineChanged(partner, detail)}
            />
          {/if}
        </div>
      </div>
    {/each}
  {/if}

  <div class="flex justify-end mt-5">
    <Button size="sm" on:click={() => (createPartnerFlag = true)}>Add partner</Button>
  </div>
</section>

{#if createPartnerFlag}
  <PartnerSelectionModal
    {user}
    onClose={() => (createPartnerFlag = false)}
    on:add-users={(event) => handleCreatePartners(event.detail)}
  />
{/if}
