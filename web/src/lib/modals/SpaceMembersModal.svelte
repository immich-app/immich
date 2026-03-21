<script lang="ts">
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import RoleBadge from '$lib/components/spaces/role-badge.svelte';
  import SpaceAddMemberModal from '$lib/modals/SpaceAddMemberModal.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import {
    removeMember,
    Role,
    SharedSpaceRole,
    updateMember,
    UserAvatarColor,
    type SharedSpaceMemberResponseDto,
  } from '@immich/sdk';
  import { BasicModal, Button, Field, modalManager, Select, Text, type SelectOption } from '@immich/ui';
  import { mdiAccountPlus } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    spaceId: string;
    members: SharedSpaceMemberResponseDto[];
    isOwner: boolean;
    spaceColor?: string | null;
    onClose: (updatedMembers?: SharedSpaceMemberResponseDto[]) => void;
  }

  let { spaceId, members: initialMembers, isOwner, spaceColor = 'primary', onClose }: Props = $props();
  let members = $state([...initialMembers]);

  const toAvatarUser = (member: SharedSpaceMemberResponseDto) => ({
    id: member.userId,
    name: member.name,
    email: member.email,
    profileImagePath: member.profileImagePath ?? '',
    avatarColor: (member.avatarColor as UserAvatarColor) ?? UserAvatarColor.Primary,
    profileChangedAt: member.profileChangedAt ?? '',
  });

  const handleRemoveMember = async (member: SharedSpaceMemberResponseDto) => {
    const confirmed = await modalManager.showDialog({
      prompt: $t('spaces_remove_member_confirmation', { values: { name: member.name } }),
      title: $t('spaces_remove_member'),
    });

    if (!confirmed) {
      return;
    }

    await removeMember({ id: spaceId, userId: member.userId });
    members = members.filter((m) => m.userId !== member.userId);
  };

  const handleAddMember = async () => {
    const added = await modalManager.show(SpaceAddMemberModal, {
      spaceId,
      existingMemberIds: members.map((m) => m.userId),
    });

    if (added && added.length > 0) {
      members = [...members, ...added];
    }
  };

  const handleRoleChange = async (member: SharedSpaceMemberResponseDto, newRole: SharedSpaceRole | 'remove') => {
    if (newRole === 'remove') {
      await handleRemoveMember(member);
      return;
    }

    const previousRole = member.role;
    members = members.map((m) => (m.userId === member.userId ? { ...m, role: newRole as unknown as Role } : m));

    try {
      const updated = await updateMember({
        id: spaceId,
        userId: member.userId,
        sharedSpaceMemberUpdateDto: { role: newRole },
      });
      members = members.map((m) => (m.userId === updated.userId ? updated : m));
    } catch (error) {
      members = members.map((m) => (m.userId === member.userId ? { ...m, role: previousRole } : m));
      handleError(error, $t('errors.error_updating_member_role'));
    }
  };

  const handleClose = () => {
    onClose(members);
  };
</script>

<BasicModal title={$t('members')} size="small" onClose={handleClose}>
  <div class="flex flex-col gap-2">
    {#if isOwner}
      <Button size="small" leadingIcon={mdiAccountPlus} onclick={handleAddMember}>
        {$t('spaces_add_member')}
      </Button>
    {/if}

    {#each members as member (member.userId)}
      <div class="flex items-center gap-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <UserAvatar user={toAvatarUser(member)} size="md" />
        <div class="flex-1">
          <Text fontWeight="medium">{member.name}</Text>
          <Text size="tiny" color="muted">{member.email}</Text>
        </div>
        {#if isOwner && member.role === 'owner'}
          <RoleBadge role="owner" {spaceColor} />
        {:else if isOwner}
          <Field class="w-32 shrink-0">
            <Select
              value={member.role as string as SharedSpaceRole}
              options={[
                { label: $t('role_editor'), value: SharedSpaceRole.Editor },
                { label: $t('role_viewer'), value: SharedSpaceRole.Viewer },
                { label: $t('remove'), value: 'remove' },
              ] as SelectOption<SharedSpaceRole | 'remove'>[]}
              onChange={(value) => handleRoleChange(member, value)}
            />
          </Field>
        {:else}
          <RoleBadge role={member.role} {spaceColor} />
        {/if}
      </div>
    {/each}
  </div>
</BasicModal>
