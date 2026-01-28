import { eventManager } from '$lib/managers/event-manager.svelte';
import type { FamilyMemberResponseDto, InvitationResponseDto } from '@immich/sdk';
import { getAllFamilyMembers, listInvitations } from '@immich/sdk';

interface FamilyModeState {
  familyMembers: FamilyMemberResponseDto[];
  invitations: InvitationResponseDto[];
  selectedMemberId: string | null;
  isLoading: boolean;
}

const defaultState: FamilyModeState = {
  familyMembers: [],
  invitations: [],
  selectedMemberId: null,
  isLoading: false,
};

export const familyModeState = $state<FamilyModeState>({ ...defaultState });

export const familyModeStore = {
  async loadFamilyMembers() {
    try {
      familyModeState.isLoading = true;
      familyModeState.familyMembers = await getAllFamilyMembers();
    } catch (error) {
      console.error('Failed to load family members:', error);
      familyModeState.familyMembers = [];
    } finally {
      familyModeState.isLoading = false;
    }
  },

  async loadInvitations() {
    try {
      familyModeState.invitations = await listInvitations();
    } catch (error) {
      console.error('Failed to load invitations:', error);
      familyModeState.invitations = [];
    }
  },

  selectMember(memberId: string | null) {
    familyModeState.selectedMemberId = memberId;
  },

  getFamilyMemberById(id: string): FamilyMemberResponseDto | undefined {
    return familyModeState.familyMembers.find((m) => m.id === id);
  },

  getFamilyMemberByTagId(tagId: string): FamilyMemberResponseDto | undefined {
    return familyModeState.familyMembers.find((m) => m.tagId === tagId);
  },

  calculateAge(birthdate: string, referenceDate?: Date): { years: number; months: number; totalMonths: number } {
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
  },

  formatAge(birthdate: string, referenceDate?: Date): string {
    const { years, months } = this.calculateAge(birthdate, referenceDate);

    if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    }

    if (months === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    }

    return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
  },

  reset() {
    Object.assign(familyModeState, defaultState);
  },
};

// Reset on logout
eventManager.on('AuthLogout', () => familyModeStore.reset());

// Reload family members when a family member is created/updated/deleted
eventManager.on('FamilyMemberCreate', () => void familyModeStore.loadFamilyMembers());
eventManager.on('FamilyMemberUpdate', () => void familyModeStore.loadFamilyMembers());
eventManager.on('FamilyMemberDelete', () => void familyModeStore.loadFamilyMembers());

// Reload invitations when invitations change
eventManager.on('InvitationCreate', () => void familyModeStore.loadInvitations());
eventManager.on('InvitationRevoke', () => void familyModeStore.loadInvitations());
