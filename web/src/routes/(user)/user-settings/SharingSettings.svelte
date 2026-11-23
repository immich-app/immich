<script lang="ts">
  import UserAvatar from '#lib/components/shared-components/UserAvatar.svelte';
  import SettingAccordion from '#lib/components/shared-components/settings/SettingAccordion.svelte';
  import SettingSwitch from '#lib/components/shared-components/settings/SettingSwitch.svelte';
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import ClusterGroupUserSelectionModal from '#lib/modals/ClusterGroupUserSelectionModal.svelte';
  import ClusterGroupUsersModal from '#lib/modals/ClusterGroupUsersModal.svelte';
  import PartnerSelectionModal from '#lib/modals/PartnerSelectionModal.svelte';
  import { executeMutation, queryClient } from '#lib/queries/client.ts';
  import {
    acceptClusterGroupRequestMutation,
    clusterGroupRegeneratePeopleMutation,
    createClusterGroupRequestMutation,
    deleteClusterGroupRequestMutation,
    getClusterGroupRequestsForGroupQuery,
    getClusterGroupRequestsQuery,
    getClusterGroupUsersQuery,
    leaveClusterGroupMutation,
  } from '#lib/queries/cluster-group.query.ts';
  import {
    createPartnerMutation,
    getPartnersQuery,
    removePartnerMutation,
    updatePartnerMutation,
  } from '#lib/queries/partner.query.ts';
  import { getPeopleUserActions } from '#lib/services/person-user.service.ts';
  import { handleError } from '#lib/utils/handle-error.ts';
  import {
    PartnerDirection,
    getMyUser,
    searchUsers,
    type ClusterGroupRequestResponseDto,
    type PartnerResponseDto,
    type UserResponseDto,
  } from '@immich/sdk';
  import { ActionButton, Button, Card, CardBody, HStack, Icon, IconButton, Text, modalManager } from '@immich/ui';
  import { mdiCheck, mdiClose } from '@mdi/js';
  import { createQuery } from '@tanstack/svelte-query';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  type PartnerSharing = {
    user: PartnerResponseDto;
    sharedByMe: boolean;
    sharedWithMe: boolean;
  };

  let candidates: Record<string, UserResponseDto> = $state({});

  const queries = {
    users: createQuery(
      () => getClusterGroupUsersQuery(authManager.user.clusterGroupId),
      () => queryClient,
    ),
    sentRequests: createQuery(
      () => getClusterGroupRequestsForGroupQuery(authManager.user.clusterGroupId),
      () => queryClient,
    ),
    receivedRequests: createQuery(getClusterGroupRequestsQuery, () => queryClient),
    sharedBy: createQuery(
      () => getPartnersQuery(PartnerDirection.SharedBy),
      () => queryClient,
    ),
    sharedWith: createQuery(
      () => getPartnersQuery(PartnerDirection.SharedWith),
      () => queryClient,
    ),
  };

  const users = $derived(queries.users.data ?? []);
  const sentRequests = $derived(queries.sentRequests.data ?? []);
  const receivedRequests = $derived(queries.receivedRequests.data ?? []);
  const canLeave = $derived(users.length > 1);

  const partners = $derived.by(() => {
    const partners: Record<string, PartnerSharing> = {};
    for (const user of queries.sharedBy.data ?? []) {
      partners[user.id] = { user, sharedByMe: true, sharedWithMe: false };
    }
    for (const user of queries.sharedWith.data ?? []) {
      partners[user.id] = { user, sharedByMe: Object.hasOwn(partners, user.id), sharedWithMe: true };
    }
    return Object.values(partners);
  });

  onMount(() => refreshClusterGroup());

  const refreshClusterGroup = async () => {
    try {
      const [user, allUsers] = await Promise.all([getMyUser(), searchUsers()]);
      authManager.setUser(user);
      candidates = Object.fromEntries(allUsers.map((user) => [user.id, user]));
    } catch (error) {
      handleError(error, $t('errors.unable_to_load_cluster_group'));
    }
  };

  const handleAddUsers = async () => {
    const excludedUserIds = [...users.map(({ id }) => id), ...sentRequests.map(({ userId }) => userId)];
    const selected = await modalManager.show(ClusterGroupUserSelectionModal, { excludedUserIds });

    for (const user of selected ?? []) {
      await executeMutation(createClusterGroupRequestMutation, [
        { id: authManager.user.clusterGroupId, clusterGroupRequestCreateDto: { userId: user.id } },
      ]);
    }
  };

  const handleViewGroup = async (request: ClusterGroupRequestResponseDto) => {
    const result = await modalManager.show(ClusterGroupUsersModal, { clusterGroupId: request.clusterGroupId });
    if (result === 'accept') {
      await executeMutation(acceptClusterGroupRequestMutation, [{ id: request.id }], {
        onSuccess: () => void refreshClusterGroup(),
      });
    } else if (result === 'decline') {
      await handleDeleteRequest(request);
    }
  };

  const handleDeleteRequest = (request: ClusterGroupRequestResponseDto) =>
    executeMutation(deleteClusterGroupRequestMutation, [{ id: request.id }]);

  const handleLeave = () =>
    executeMutation(leaveClusterGroupMutation, [{ id: authManager.user.clusterGroupId }], {
      confirm: { title: $t('leave_group'), prompt: $t('leave_group_description') },
      onSuccess: () => void refreshClusterGroup(),
    });

  const handleRemovePartner = (partner: PartnerResponseDto) =>
    executeMutation(removePartnerMutation, [{ id: partner.id }], {
      confirm: {
        title: $t('stop_photo_sharing'),
        prompt: $t('stop_photo_sharing_description', { values: { partner: partner.name } }),
      },
    });

  const handleCreatePartners = async () => {
    const users = await modalManager.show(PartnerSelectionModal, {});

    for (const user of users ?? []) {
      await executeMutation(createPartnerMutation, [{ partnerCreateDto: { sharedWithId: user.id } }]);
    }
  };

  const handleShowOnTimelineChanged = (partner: PartnerSharing, inTimeline: boolean) =>
    executeMutation(updatePartnerMutation, [{ id: partner.user.id, partnerUpdateDto: { inTimeline } }]);

  const handleRerunFacialRecognition = () =>
    executeMutation(clusterGroupRegeneratePeopleMutation, [{ id: authManager.user.clusterGroupId }], {
      confirm: {
        title: $t('cluster_group_facial_recognition'),
        prompt: $t('cluster_group_facial_recognition_prompt'),
        size: 'medium',
      },
    });
</script>

<section class="my-4">
  <div class="flex flex-col sm:ms-4 md:ms-8">
    <SettingAccordion key="cluster-group" title={$t('people_cluster_group')} subtitle={$t('cluster_group_description')}>
      <Card class="mt-4">
        <CardBody>
          {#each users as user, index (user.id)}
            {const { ManageAccess } = $derived(
              getPeopleUserActions($t, [
                user,
                ...users.filter(({ id }) => id !== authManager.user.id && id !== user.id),
              ]),
            )}
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
              {:else if user.id !== authManager.user.id}
                <ActionButton type="icon" variant="filled" action={ManageAccess} />
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
              {const user = $derived(candidates[request.userId])}
              <div
                class="flex items-center justify-between gap-4"
                class:mt-4={index > 0 || receivedRequests.length > 0}
              >
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
    </SettingAccordion>

    <SettingAccordion key="partners" title={$t('partners')} subtitle={$t('partners_description')}>
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
                  checked={partner.user.inTimeline ?? false}
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
    </SettingAccordion>
  </div>
</section>
