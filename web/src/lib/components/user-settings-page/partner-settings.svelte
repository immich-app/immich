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

  interface PartnerSharing {
    user: UserResponseDto;
    sharedByMe: boolean;
    sharedWithMe: boolean;
    inTimeline: boolean;
  }

  export let user: UserResponseDto;

  let createPartner = false;
  let removePartner: PartnerResponseDto | null = null;
  let partners: Array<PartnerSharing> = [];

  onMount(() => {
    refreshPartners();
  });

  const refreshPartners = async () => {
    partners = [];

    const [{ data: sharedBy }, { data: sharedWith }] = await Promise.all([
      api.partnerApi.getPartners({ direction: 'shared-by' }),
      api.partnerApi.getPartners({ direction: 'shared-with' }),
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

  const handleShowOnTimelineChanged = async (partner: PartnerSharing, inTimeline: boolean) => {
    try {
      await api.partnerApi.updatePartner({ id: partner.user.id, updatePartnerDto: { inTimeline } });

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
              on:click={() => (removePartner = partner.user)}
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
    prompt="{removePartner.name} will no longer be able to access your photos."
    on:cancel={() => (removePartner = null)}
    on:confirm={() => handleRemovePartner()}
  />
{/if}
