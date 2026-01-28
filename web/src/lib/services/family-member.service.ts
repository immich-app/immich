import { goto } from '$app/navigation';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { Route } from '$lib/route';
import { handleError } from '$lib/utils/handle-error';
import {
  createFamilyMember,
  deleteFamilyMember,
  updateFamilyMember,
  type CreateFamilyMemberDto,
  type FamilyMemberResponseDto,
  type UpdateFamilyMemberDto,
} from '@immich/sdk';
import { toastManager, MenuItemType, type MenuItems } from '@immich/ui';
import { mdiDeleteOutline, mdiPencilOutline, mdiPlusBoxOutline } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';

export const getFamilyMembersActions = ($t: MessageFormatter) => ({
  Create: {
    title: $t('add_family_member'),
    icon: mdiPlusBoxOutline,
    onAction: () => goto(Route.newFamilyMember()),
  },
});

export const getFamilyMemberActions = ($t: MessageFormatter, member: FamilyMemberResponseDto): MenuItems => [
  {
    title: $t('edit'),
    icon: mdiPencilOutline,
    onAction: () => goto(Route.editFamilyMember(member)),
  },
  MenuItemType.Divider,
  {
    title: $t('delete'),
    icon: mdiDeleteOutline,
    onAction: () => void handleDeleteFamilyMember($t, member.id, member.name),
  },
];

export const handleCreateFamilyMember = async (
  $t: MessageFormatter,
  dto: CreateFamilyMemberDto,
): Promise<FamilyMemberResponseDto | null> => {
  try {
    const member = await createFamilyMember({ createFamilyMemberDto: dto });
    toastManager.success($t('family_member_created'));
    eventManager.emit('FamilyMemberCreate', member);
    return member;
  } catch (error) {
    handleError(error, $t('errors.unable_to_create_family_member'));
    return null;
  }
};

export const handleUpdateFamilyMember = async (
  $t: MessageFormatter,
  id: string,
  dto: UpdateFamilyMemberDto,
): Promise<FamilyMemberResponseDto | null> => {
  try {
    const member = await updateFamilyMember({ id, updateFamilyMemberDto: dto });
    toastManager.success($t('family_member_updated'));
    eventManager.emit('FamilyMemberUpdate', member);
    return member;
  } catch (error) {
    handleError(error, $t('errors.unable_to_update_family_member'));
    return null;
  }
};

export const handleDeleteFamilyMember = async ($t: MessageFormatter, id: string, name: string): Promise<boolean> => {
  if (!confirm($t('confirm_delete_family_member', { values: { name } }))) {
    return false;
  }

  try {
    await deleteFamilyMember({ id });
    toastManager.success($t('family_member_deleted'));
    eventManager.emit('FamilyMemberDelete', { id });
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_delete_family_member'));
    return false;
  }
};

export const calculateAge = (
  birthdate: string,
  referenceDate?: Date,
): { years: number; months: number; totalMonths: number } => {
  const birth = new Date(birthdate);
  const reference = referenceDate || new Date();

  let years = reference.getFullYear() - birth.getFullYear();
  let months = reference.getMonth() - birth.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  if (reference.getDate() < birth.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }

  const totalMonths = years * 12 + months;
  return { years, months, totalMonths };
};

export const formatAge = (birthdate: string, referenceDate?: Date): string => {
  const { years, months } = calculateAge(birthdate, referenceDate);

  if (years === 0) {
    return `${months} month${months !== 1 ? 's' : ''}`;
  }

  if (months === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  }

  return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
};
