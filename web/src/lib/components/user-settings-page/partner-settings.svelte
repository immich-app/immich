<script lang="ts">
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import DateInput from '$lib/elements/DateInput.svelte';
  import PartnerSelectionModal from '$lib/modals/PartnerSelectionModal.svelte';
  import {
    createPartner,
    getPartners,
    PartnerDirection,
    removePartner,
    updatePartner,
    type PartnerResponseDto,
    type UserResponseDto,
  } from '@immich/sdk';
  import { Button, Icon, IconButton, modalManager, Field } from '@immich/ui';
  import { mdiCheck, mdiClose, mdiPencil } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { handleError } from '../../utils/handle-error';

  interface PartnerSharing {
    user: UserResponseDto;
    sharedByMe: boolean;
    sharedWithMe: boolean;
    inTimeline: boolean;
    startDate?: string | null;
  }

  interface Props {
    user: UserResponseDto;
  }

  let { user }: Props = $props();

  let partners: Array<PartnerSharing> = $state([]);
  let editingStartDate: Record<string, boolean> = $state({});
  let tempStartDates: Record<string, string | undefined> = $state({});

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
          startDate: candidate.startDate,
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
            startDate: candidate.startDate,
          },
        ];
      } else {
        partners[existIndex].sharedWithMe = true;
        partners[existIndex].inTimeline = candidate.inTimeline ?? false;
        partners[existIndex].startDate = candidate.startDate;
      }
    }
  };

  const handleRemovePartner = async (partner: PartnerResponseDto) => {
    const isConfirmed = await modalManager.showDialog({
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

  const handleCreatePartners = async () => {
    const result = await modalManager.show(PartnerSelectionModal, { user });

    if (!result) {
      return;
    }

    const [users, startDate] = result;

    if (!users) {
      return;
    }

    try {
      for (const selectedUser of users) {
        await createPartner({
          partnerCreateDto: {
            sharedWithId: selectedUser.id,
            startDate: startDate || undefined,
          }
        });
      }

      await refreshPartners();
    } catch (error) {
      handleError(error, $t('errors.unable_to_add_partners'));
    }
  };

  const handleShowOnTimelineChanged = async (partner: PartnerSharing, inTimeline: boolean) => {
    try {
      await updatePartner({ id: partner.user.id, partnerUpdateDto: { inTimeline } });

      partner.inTimeline = inTimeline;
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_timeline_display_status'));
    }
  };

  const handleEditStartDate = (partnerId: string, currentDate?: string | null) => {
    editingStartDate[partnerId] = true;
    tempStartDates[partnerId] = currentDate ? currentDate.split('T')[0] : undefined;
  };

  const handleSaveStartDate = async (partner: PartnerSharing) => {
    try {
      const newDate = tempStartDates[partner.user.id];
      await updatePartner({
        id: partner.user.id,
        partnerUpdateDto: {
          inTimeline: partner.inTimeline,
          startDate: newDate || null,
        }
      });

      partner.startDate = newDate || null;
      editingStartDate[partner.user.id] = false;
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_partner'));
    }
  };

  const handleCancelEditStartDate = (partnerId: string) => {
    editingStartDate[partnerId] = false;
    delete tempStartDates[partnerId];
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return null;
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
            <div class="text-start">
              <p class="text-immich-fg dark:text-immich-dark-fg">
                {partner.user.name}
              </p>
              <p class="text-sm text-immich-fg/75 dark:text-immich-dark-fg/75">
                {partner.user.email}
              </p>
            </div>
          </div>

          {#if partner.sharedByMe}
            <IconButton
              shape="round"
              color="secondary"
              variant="ghost"
              onclick={() => handleRemovePartner(partner.user)}
              icon={mdiClose}
              size="small"
              aria-label={$t('stop_sharing_photos_with_user')}
            />
          {/if}
        </div>

        <div class="dark:text-gray-200 text-immich-dark-gray">
          <!-- I am sharing my assets with this user -->
          {#if partner.sharedByMe}
            <hr class="my-4 border border-gray-200 dark:border-gray-700" />
            <p class="uppercase text-xs font-medium my-4">
              {$t('shared_with_partner', { values: { partner: partner.user.name } })}
            </p>
            <p class="text-md">{$t('partner_can_access', { values: { partner: partner.user.name } })}</p>
            <ul class="text-sm">
              <li class="flex gap-2 place-items-center py-1 mt-2">
                <Icon icon={mdiCheck} />
                {$t('partner_can_access_assets')}
              </li>
              <li class="flex gap-2 place-items-center py-1">
                <Icon icon={mdiCheck} />
                {$t('partner_can_access_location')}
              </li>
            </ul>

            <div class="mt-4">
              {#if editingStartDate[partner.user.id]}
                <Field label={$t('partner_sharing_start_date')} description={$t('partner_sharing_start_date_description')}>
                  <div class="flex gap-2 items-center mt-2">
                    <DateInput
                      class="immich-form-input flex-1"
                      id="partner-start-date-{partner.user.id}"
                      type="date"
                      bind:value={tempStartDates[partner.user.id]}
                    />
                    <Button size="small" onclick={() => handleSaveStartDate(partner)}>{$t('save')}</Button>
                    <Button size="small" color="secondary" onclick={() => handleCancelEditStartDate(partner.user.id)}>{$t('cancel')}</Button>
                  </div>
                </Field>
              {:else}
                <div class="flex items-center justify-between py-2">
                  <div class="flex-1">
                    <p class="text-sm font-medium">{$t('partner_sharing_start_date')}</p>
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                      {#if partner.startDate}
                        {$t('partner_sharing_start_date_help', { values: { date: formatDate(partner.startDate) } })}
                      {:else}
                        {$t('partner_sharing_start_date_none')}
                      {/if}
                    </p>
                  </div>
                  <IconButton
                    shape="round"
                    color="secondary"
                    variant="ghost"
                    onclick={() => handleEditStartDate(partner.user.id, partner.startDate)}
                    icon={mdiPencil}
                    size="small"
                    aria-label={$t('edit')}
                  />
                </div>
              {/if}
            </div>
          {/if}

          <!-- this user is sharing assets with me -->
          {#if partner.sharedWithMe}
            <hr class="my-4 border border-gray-200 dark:border-gray-700" />
            <p class="uppercase text-xs font-medium my-4">
              {$t('shared_from_partner', { values: { partner: partner.user.name } })}
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
    <Button shape="round" size="small" onclick={() => handleCreatePartners()}>{$t('add_partner')}</Button>
  </div>
</section>
