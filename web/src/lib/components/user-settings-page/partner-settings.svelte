<script lang="ts">
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import {
    createPartner,
    getPartners,
    PartnerDirection,
    removePartner,
    updatePartner,
    type PartnerResponseDto,
    type UserResponseDto,
  } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import { mdiCheck, mdiClose } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { handleError } from '../../utils/handle-error';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import Icon from '../elements/icon.svelte';
  import PartnerSelectionModal from './partner-selection-modal.svelte';

  interface PartnerSharing {
    user: UserResponseDto;
    sharedByMe: boolean;
    sharedWithMe: boolean;
    inTimeline: boolean;
  }

  interface Props {
    user: UserResponseDto;
  }

  let { user }: Props = $props();

  let createPartnerFlag = $state(false);
  // let removePartnerDto: PartnerResponseDto | null = null;
  let partners: Array<PartnerSharing> = $state([]);

  onMount(async () => {
    await refreshPartners();
  });

  const refreshPartners = async () => {
    partners = [];

    const [sharedBy, sharedWith] = await Promise.all([
      getPartners({ direction: PartnerDirection.SharedBy }),
      getPartners({ direction: PartnerDirection.SharedWith }),
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

      if (existIndex === -1) {
        partners = [
          ...partners,
          {
            user: candidate,
            sharedByMe: false,
            sharedWithMe: true,
            inTimeline: candidate.inTimeline ?? false,
          },
        ];
      } else {
        partners[existIndex].sharedWithMe = true;
        partners[existIndex].inTimeline = candidate.inTimeline ?? false;
      }
    }
  };

  const handleRemovePartner = async (partner: PartnerResponseDto) => {
    const isConfirmed = await dialogController.show({
      title: $t('stop_photo_sharing'),
      prompt: $t('stop_photo_sharing_description', { values: { partner: partner.name } }),
    });

    if (!isConfirmed) {
      return;
    }

    try {
      await removePartner({ id: partner.id });
      await refreshPartners();
    } catch (error) {
      handleError(error, $t('errors.unable_to_remove_partner'));
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
      handleError(error, $t('errors.unable_to_add_partners'));
    }
  };

  const handleShowOnTimelineChanged = async (partner: PartnerSharing, inTimeline: boolean) => {
    try {
      await updatePartner({ id: partner.user.id, updatePartnerDto: { inTimeline } });

      partner.inTimeline = inTimeline;
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_timeline_display_status'));
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
              onclick={() => handleRemovePartner(partner.user)}
              icon={mdiClose}
              size="16"
              title={$t('stop_sharing_photos_with_user')}
            />
          {/if}
        </div>

        <div class="dark:text-gray-200 text-immich-dark-gray">
          <!-- I am sharing my assets with this user -->
          {#if partner.sharedByMe}
            <hr class="my-4 border border-gray-200 dark:border-gray-700" />
            <p class="text-xs font-medium my-4">
              {$t('shared_with_partner', { values: { partner: partner.user.name } }).toUpperCase()}
            </p>
            <p class="text-md">{$t('partner_can_access', { values: { partner: partner.user.name } })}</p>
            <ul class="text-sm">
              <li class="flex gap-2 place-items-center py-1 mt-2">
                <Icon path={mdiCheck} />
                {$t('partner_can_access_assets')}
              </li>
              <li class="flex gap-2 place-items-center py-1">
                <Icon path={mdiCheck} />
                {$t('partner_can_access_location')}
              </li>
            </ul>
          {/if}

          <!-- this user is sharing assets with me -->
          {#if partner.sharedWithMe}
            <hr class="my-4 border border-gray-200 dark:border-gray-700" />
            <p class="text-xs font-medium my-4">
              {$t('shared_from_partner', { values: { partner: partner.user.name } }).toUpperCase()}
            </p>
            <SettingSwitch
              title={$t('show_in_timeline')}
              subtitle={$t('show_in_timeline_setting_description')}
              bind:checked={partner.inTimeline}
              onToggle={(isChecked) => handleShowOnTimelineChanged(partner, isChecked)}
            />
          {/if}
        </div>
      </div>
    {/each}
  {/if}

  <div class="flex justify-end mt-5">
    <Button shape="round" size="small" onclick={() => (createPartnerFlag = true)}>{$t('add_partner')}</Button>
  </div>
</section>

{#if createPartnerFlag}
  <PartnerSelectionModal {user} onClose={() => (createPartnerFlag = false)} onAddUsers={handleCreatePartners} />
{/if}
