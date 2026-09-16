<script lang="ts">
  import SettingSwitch from '$lib/components/shared-components/settings/SettingSwitch.svelte';
  import UserAvatar from '$lib/components/shared-components/UserAvatar.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import ClusterGroupUserSelectionModal from '$lib/modals/ClusterGroupUserSelectionModal.svelte';
  import ClusterGroupUsersModal from '$lib/modals/ClusterGroupUsersModal.svelte';
  import PartnerSelectionModal from '$lib/modals/PartnerSelectionModal.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import {
    acceptClusterGroupRequest,
    clusterGroupRegeneratePeople,
    createClusterGroupRequest,
    createPartner,
    deleteClusterGroupRequest,
    getClusterGroupRequests,
    getClusterGroupRequestsForGroup,
    getClusterGroupUsers,
    getMyUser,
    getPartners,
    leaveClusterGroup,
    PartnerDirection,
    removePartner,
    searchUsers,
    updatePartner,
    type ClusterGroupRequestResponseDto,
    type PartnerResponseDto,
    type UserResponseDto,
  } from '@immich/sdk';
  import { Button, Card, CardBody, HStack, Icon, IconButton, modalManager, Text } from '@immich/ui';
  import { mdiCheck, mdiClose } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  type PartnerSharing = {
    user: UserResponseDto;
    sharedByMe: boolean;
    sharedWithMe: boolean;
    inTimeline: boolean;
  };

  let clusterGroupId: string = $state('');
  let users: UserResponseDto[] = $state([]);
  let sentRequests: ClusterGroupRequestResponseDto[] = $state([]);
  let receivedRequests: ClusterGroupRequestResponseDto[] = $state([]);
  // a request is sent to someone outside of the group, so they come from elsewhere
  let candidates: Record<string, UserResponseDto> = $state({});

  let partners: Array<PartnerSharing> = $state([]);

  const canLeave = $derived(users.length > 1);

  onMount(async () => {
    await Promise.all([refresh(), refreshPartners()]);
  });

  const refresh = async () => {
    try {
      const { clusterGroupId: id } = await getMyUser();
      clusterGroupId = id;

      const [groupUsers, sent, received, allUsers] = await Promise.all([
        getClusterGroupUsers({ id }),
        getClusterGroupRequestsForGroup({ id }),
        getClusterGroupRequests(),
        searchUsers(),
      ]);

      users = groupUsers;
      sentRequests = sent;
      receivedRequests = received;
      candidates = Object.fromEntries(allUsers.map((user) => [user.id, user]));
    } catch (error) {
      handleError(error, $t('errors.unable_to_load_cluster_group'));
    }
  };

  const handleAddUsers = async () => {
    const excludedUserIds = [...users.map(({ id }) => id), ...sentRequests.map(({ userId }) => userId)];
    const selected = await modalManager.show(ClusterGroupUserSelectionModal, { excludedUserIds });

    if (!selected) {
      return;
    }

    try {
      for (const user of selected) {
        await createClusterGroupRequest({ id: clusterGroupId, clusterGroupRequestCreateDto: { userId: user.id } });
      }

      await refresh();
    } catch (error) {
      handleError(error, $t('errors.something_went_wrong'));
    }
  };

  const handleViewGroup = async (request: ClusterGroupRequestResponseDto) => {
    const result = await modalManager.show(ClusterGroupUsersModal, { clusterGroupId: request.clusterGroupId });
    if (result === 'accept') {
      await handleAcceptRequest(request);
    } else if (result === 'decline') {
      await handleDeleteRequest(request);
    }
  };

  const handleAcceptRequest = async (request: ClusterGroupRequestResponseDto) => {
    try {
      await acceptClusterGroupRequest({ id: request.id });
      await refresh();
    } catch (error) {
      handleError(error, $t('errors.something_went_wrong'));
    }
  };

  const handleDeleteRequest = async (request: ClusterGroupRequestResponseDto) => {
    try {
      await deleteClusterGroupRequest({ id: request.id });
      await refresh();
    } catch (error) {
      handleError(error, $t('errors.something_went_wrong'));
    }
  };

  const handleLeave = async () => {
    const isConfirmed = await modalManager.showDialog({
      title: $t('leave_group'),
      prompt: $t('leave_group_description'),
    });

    if (!isConfirmed) {
      return;
    }

    try {
      await leaveClusterGroup({ id: clusterGroupId });
      await refresh();
    } catch (error) {
      handleError(error, $t('errors.unable_to_leave_cluster_group'));
    }
  };

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
    const users = await modalManager.show(PartnerSelectionModal, {});

    if (!users) {
      return;
    }

    try {
      for (const user of users) {
        await createPartner({ partnerCreateDto: { sharedWithId: user.id } });
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

  const handleRerunFacialRecognition = async () => {
    const confirmed = await modalManager.showDialog({
      title: $t('cluster_group_facial_recognition'),
      prompt: $t('cluster_group_facial_recognition_prompt'),
      size: 'medium',
    });

    if (!confirmed) {
      return;
    }

    try {
      await clusterGroupRegeneratePeople({ id: clusterGroupId });
    } catch (error) {
      handleError(error, $t('errors.something_went_wrong'));
    }
  };
</script>

<section class="my-4">
  <Text size="large" fontWeight="medium">{$t('cluster_group')}</Text>
  <Text size="small" color="muted">{$t('cluster_group_description')}</Text>

  <Card class="mt-4">
    <CardBody>
      {#each users as user, index (user.id)}
        <div class="flex items-center justify-between gap-4" class:mt-4={index > 0}>
          <div class="flex items-center gap-4">
            <UserAvatar {user} size="md" />
            <div class="text-start">
              <p class="text-immich-fg dark:text-immich-dark-fg">
                {user.name}
                {#if user.id === authManager.user.id}
                  <span class="text-sm text-immich-fg/75 dark:text-immich-dark-fg/75">({$t('you')})</span>
                {/if}
              </p>
              <p class="text-sm text-immich-fg/75 dark:text-immich-dark-fg/75">{user.email}</p>
            </div>
          </div>

          {#if user.id === authManager.user.id && canLeave}
            <Button shape="round" size="small" color="secondary" onclick={() => handleLeave()}>
              {$t('leave')}
            </Button>
          {/if}
        </div>
      {/each}
    </CardBody>
  </Card>

  {#if sentRequests.length > 0 || receivedRequests.length > 0}
    <div class="mt-4">
      <Text size="small" fontWeight="medium">{$t('pending')}</Text>
    </div>

    <Card color="secondary" class="mt-2">
      <CardBody>
        {#each receivedRequests as request, index (request.id)}
          <div class="flex items-center justify-between gap-4" class:mt-4={index > 0}>
            <Text size="small">{$t('request_received_description')}</Text>
            <div class="flex gap-2">
              <Button shape="round" size="small" color="secondary" onclick={() => handleViewGroup(request)}>
                {$t('view_group')}
              </Button>
            </div>
          </div>
        {/each}

        {#each sentRequests as request, index (request.id)}
          {@const user = candidates[request.userId]}
          <div class="flex items-center justify-between gap-4" class:mt-4={index > 0 || receivedRequests.length > 0}>
            <div class="flex items-center gap-4">
              {#if user}
                <UserAvatar {user} size="md" />
              {/if}
              <div class="text-start">
                <p class="text-immich-fg dark:text-immich-dark-fg">{user?.name ?? request.userId}</p>
                <p class="text-sm text-immich-fg/75 dark:text-immich-dark-fg/75">{user?.email ?? ''}</p>
              </div>
            </div>

            <Button shape="round" size="small" color="secondary" onclick={() => handleDeleteRequest(request)}>
              {$t('cancel')}
            </Button>
          </div>
        {/each}
      </CardBody>
    </Card>
  {/if}

  <HStack fullWidth class="mt-5 justify-end">
    <Button shape="round" size="small" onclick={() => handleRerunFacialRecognition()}
      >{$t('cluster_group_facial_recognition')}</Button
    >
    <Button shape="round" size="small" onclick={() => handleAddUsers()}>{$t('add_user')}</Button>
  </HStack>
</section>

<section class="my-4">
  <Text size="large" fontWeight="medium">{$t('partners')}</Text>

  {#if partners.length > 0}
    {#each partners as partner (partner.user.id)}
      <div class="mt-6 rounded-2xl border border-gray-200 bg-slate-50 p-5 dark:border-gray-800 dark:bg-gray-900">
        <div class="flex justify-between gap-4 rounded-lg pb-4 transition-all">
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

        <div class="text-immich-dark-gray dark:text-gray-200">
          <!-- I am sharing my assets with this user -->
          {#if partner.sharedByMe}
            <hr class="my-4 border border-gray-200 dark:border-gray-700" />
            <Text class="my-4" size="small" fontWeight="medium">
              {$t('shared_with_partner', { values: { partner: partner.user.name } })}
            </Text>
            <Text size="tiny" fontWeight="medium"
              >{$t('partner_can_access', { values: { partner: partner.user.name } })}</Text
            >
            <ul class="text-sm">
              <li class="mt-2 flex place-items-center gap-2 py-1">
                <Icon icon={mdiCheck} />
                {$t('partner_can_access_assets')}
              </li>
              <li class="flex place-items-center gap-2 py-1">
                <Icon icon={mdiCheck} />
                {$t('partner_can_access_location')}
              </li>
            </ul>
          {/if}

          <!-- this user is sharing assets with me -->
          {#if partner.sharedWithMe}
            <hr class="my-4 border border-gray-200 dark:border-gray-700" />
            <Text class="my-4" size="small" fontWeight="medium">
              {$t('shared_from_partner', { values: { partner: partner.user.name } })}
            </Text>

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

  <div class="mt-5 flex justify-end">
    <Button shape="round" size="small" onclick={() => handleCreatePartners()}>{$t('add_partner')}</Button>
  </div>
</section>
