import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';
import type { SavedAccount } from '$lib/stores/saved-accounts.store';
import * as savedAccountsStore from '$lib/stores/saved-accounts.store';
import { resetSavedUser, user } from '$lib/stores/user.store';
import { UserAvatarColor, UserStatus, type UserAdminResponseDto } from '@immich/sdk';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SwitchAccountModal from './SwitchAccountModal.svelte';

// Mock modules
vi.mock('$lib/stores/saved-accounts.store', () => ({
  getSavedAccounts: vi.fn(),
  removeSavedAccount: vi.fn(),
}));

vi.mock('$lib/managers/auth-manager.svelte', () => ({
  authManager: {
    switchToAccount: vi.fn(),
  },
}));

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

import { goto } from '$app/navigation';
import { authManager } from '$lib/managers/auth-manager.svelte';

describe('SwitchAccountModal', () => {
  const mockOnClose = vi.fn();

  const createMockAccount = (overrides?: Partial<SavedAccount>): SavedAccount => ({
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    profileImagePath: '/profile.jpg',
    token: 'test-token',
    isExpired: false,
    ...overrides,
  });

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    vi.stubGlobal('visualViewport', getVisualViewportMock());
    vi.resetAllMocks();
    Element.prototype.animate = getAnimateMock();
    resetSavedUser();
  });

  afterAll(async () => {
    await waitFor(() => {
      expect(document.body.style.pointerEvents).not.toBe('none');
    });
  });

  describe('rendering', () => {
    it('should show loading state initially', async () => {
      vi.mocked(savedAccountsStore.getSavedAccounts).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100)),
      );

      render(SwitchAccountModal, { props: { onClose: mockOnClose } });

      // Loading spinner should be visible (mdiLoading is rendered as an SVG path)
      const loadingElement = document.querySelector('.animate-spin');
      expect(loadingElement).toBeTruthy();
    });

    it('should show "No other saved accounts" when no accounts exist', async () => {
      vi.mocked(savedAccountsStore.getSavedAccounts).mockResolvedValue([]);

      render(SwitchAccountModal, { props: { onClose: mockOnClose } });

      await waitFor(() => {
        expect(screen.getByText('no_saved_accounts')).toBeInTheDocument();
      });
    });

    it('should render saved accounts list', async () => {
      const accounts = [
        createMockAccount({ id: 'user-1', name: 'User One', email: 'user1@example.com' }),
        createMockAccount({ id: 'user-2', name: 'User Two', email: 'user2@example.com' }),
      ];
      vi.mocked(savedAccountsStore.getSavedAccounts).mockResolvedValue(accounts);

      render(SwitchAccountModal, { props: { onClose: mockOnClose } });

      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
        expect(screen.getByText('User Two')).toBeInTheDocument();
        expect(screen.getByText('user1@example.com')).toBeInTheDocument();
        expect(screen.getByText('user2@example.com')).toBeInTheDocument();
      });
    });

    it('should show avatar initial from name', async () => {
      const accounts = [createMockAccount({ name: 'Alice' })];
      vi.mocked(savedAccountsStore.getSavedAccounts).mockResolvedValue(accounts);

      render(SwitchAccountModal, { props: { onClose: mockOnClose } });

      await waitFor(() => {
        expect(screen.getByText('A')).toBeInTheDocument();
      });
    });

    it('should show "Current" badge for current user', async () => {
      const currentUser: UserAdminResponseDto = {
        id: 'current-user-id',
        name: 'Current User',
        email: 'current@example.com',
        profileImagePath: '',
        avatarColor: UserAvatarColor.Primary,
        profileChangedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        deletedAt: null,
        isAdmin: false,
        license: null,
        oauthId: '',
        quotaSizeInBytes: null,
        quotaUsageInBytes: 0,
        shouldChangePassword: false,
        status: UserStatus.Active,
        storageLabel: null,
        updatedAt: new Date().toISOString(),
      };
      user.set(currentUser);

      const accounts = [
        createMockAccount({ id: 'current-user-id', name: 'Current User', email: 'current@example.com' }),
        createMockAccount({ id: 'other-user-id', name: 'Other User', email: 'other@example.com' }),
      ];
      vi.mocked(savedAccountsStore.getSavedAccounts).mockResolvedValue(accounts);

      render(SwitchAccountModal, { props: { onClose: mockOnClose } });

      await waitFor(() => {
        expect(screen.getByText('current')).toBeInTheDocument();
      });
    });

    it('should show "Session expired" badge for expired accounts', async () => {
      const accounts = [createMockAccount({ isExpired: true })];
      vi.mocked(savedAccountsStore.getSavedAccounts).mockResolvedValue(accounts);

      render(SwitchAccountModal, { props: { onClose: mockOnClose } });

      await waitFor(() => {
        expect(screen.getByText('session_expired')).toBeInTheDocument();
      });
    });

    it('should show Add Account button', async () => {
      vi.mocked(savedAccountsStore.getSavedAccounts).mockResolvedValue([]);

      render(SwitchAccountModal, { props: { onClose: mockOnClose } });

      await waitFor(() => {
        expect(screen.getByText('add_account')).toBeInTheDocument();
      });
    });
  });

  describe('account switching', () => {
    it('should call switchToAccount and close modal on successful switch', async () => {
      const accounts = [createMockAccount({ id: 'other-user' })];
      vi.mocked(savedAccountsStore.getSavedAccounts).mockResolvedValue(accounts);
      vi.mocked(authManager.switchToAccount).mockResolvedValue(true);

      render(SwitchAccountModal, { props: { onClose: mockOnClose } });

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      // Click on account
      const accountButton = screen.getByRole('button', { name: /Test User/i });
      await fireEvent.click(accountButton);

      await waitFor(() => {
        expect(authManager.switchToAccount).toHaveBeenCalledWith('other-user');
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show error and reload accounts when switch fails', async () => {
      const accounts = [createMockAccount({ id: 'other-user', isExpired: false })];
      vi.mocked(savedAccountsStore.getSavedAccounts)
        .mockResolvedValueOnce(accounts)
        .mockResolvedValueOnce([createMockAccount({ id: 'other-user', isExpired: true })]);
      vi.mocked(authManager.switchToAccount).mockResolvedValue(false);

      render(SwitchAccountModal, { props: { onClose: mockOnClose } });

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      const accountButton = screen.getByRole('button', { name: /Test User/i });
      await fireEvent.click(accountButton);

      await waitFor(() => {
        expect(screen.getByText('session_expired')).toBeInTheDocument();
      });
    });

    it('should close modal when clicking current account', async () => {
      const currentUser: UserAdminResponseDto = {
        id: 'current-user-id',
        name: 'Current User',
        email: 'current@example.com',
        profileImagePath: '',
        avatarColor: UserAvatarColor.Primary,
        profileChangedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        deletedAt: null,
        isAdmin: false,
        license: null,
        oauthId: '',
        quotaSizeInBytes: null,
        quotaUsageInBytes: 0,
        shouldChangePassword: false,
        status: UserStatus.Active,
        storageLabel: null,
        updatedAt: new Date().toISOString(),
      };
      user.set(currentUser);

      const accounts = [createMockAccount({ id: 'current-user-id', name: 'Current User' })];
      vi.mocked(savedAccountsStore.getSavedAccounts).mockResolvedValue(accounts);

      render(SwitchAccountModal, { props: { onClose: mockOnClose } });

      await waitFor(() => {
        expect(screen.getByText('Current User')).toBeInTheDocument();
      });

      const accountButton = screen.getByRole('button', { name: /Current User/i });
      await fireEvent.click(accountButton);

      expect(mockOnClose).toHaveBeenCalled();
      expect(authManager.switchToAccount).not.toHaveBeenCalled();
    });

    it('should disable switch button for expired accounts', async () => {
      const accounts = [createMockAccount({ id: 'expired-user', isExpired: true })];
      vi.mocked(savedAccountsStore.getSavedAccounts).mockResolvedValue(accounts);

      render(SwitchAccountModal, { props: { onClose: mockOnClose } });

      await waitFor(() => {
        const accountButton = screen.getByRole('button', { name: /Test User/i });
        expect(accountButton).toBeDisabled();
      });
    });
  });

  describe('account removal', () => {
    it('should call removeSavedAccount and reload accounts', async () => {
      const accounts = [createMockAccount({ id: 'user-to-remove', name: 'User to Remove' })];
      vi.mocked(savedAccountsStore.getSavedAccounts).mockResolvedValueOnce(accounts).mockResolvedValueOnce([]);
      vi.mocked(savedAccountsStore.removeSavedAccount).mockResolvedValue(undefined);

      render(SwitchAccountModal, { props: { onClose: mockOnClose } });

      await waitFor(() => {
        expect(screen.getByText('User to Remove')).toBeInTheDocument();
      });

      // Find and click the remove button (using aria-label)
      const removeButton = screen.getByRole('button', { name: 'remove_account' });
      await fireEvent.click(removeButton);

      await waitFor(() => {
        expect(savedAccountsStore.removeSavedAccount).toHaveBeenCalledWith('user-to-remove');
      });
    });

    it('should not show remove button for current user', async () => {
      const currentUser: UserAdminResponseDto = {
        id: 'current-user-id',
        name: 'Current User',
        email: 'current@example.com',
        profileImagePath: '',
        avatarColor: UserAvatarColor.Primary,
        profileChangedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        deletedAt: null,
        isAdmin: false,
        license: null,
        oauthId: '',
        quotaSizeInBytes: null,
        quotaUsageInBytes: 0,
        shouldChangePassword: false,
        status: UserStatus.Active,
        storageLabel: null,
        updatedAt: new Date().toISOString(),
      };
      user.set(currentUser);

      const accounts = [createMockAccount({ id: 'current-user-id', name: 'Current User' })];
      vi.mocked(savedAccountsStore.getSavedAccounts).mockResolvedValue(accounts);

      render(SwitchAccountModal, { props: { onClose: mockOnClose } });

      await waitFor(() => {
        expect(screen.getByText('Current User')).toBeInTheDocument();
      });

      // Remove button should not exist for current user
      expect(screen.queryByRole('button', { name: 'remove_account' })).not.toBeInTheDocument();
    });
  });

  describe('re-authentication', () => {
    it('should navigate to login with reauth param for expired accounts', async () => {
      const accounts = [createMockAccount({ id: 'expired-user-id', isExpired: true })];
      vi.mocked(savedAccountsStore.getSavedAccounts).mockResolvedValue(accounts);

      render(SwitchAccountModal, { props: { onClose: mockOnClose } });

      await waitFor(() => {
        expect(screen.getByText('session_expired')).toBeInTheDocument();
      });

      // Find and click the re-authenticate button
      const reauthButton = screen.getByRole('button', { name: 're_authenticate' });
      await fireEvent.click(reauthButton);

      await waitFor(() => {
        expect(goto).toHaveBeenCalledWith('/auth/login?reauth=expired-user-id');
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('add account', () => {
    it('should navigate to login with addAccount param', async () => {
      vi.mocked(savedAccountsStore.getSavedAccounts).mockResolvedValue([]);

      render(SwitchAccountModal, { props: { onClose: mockOnClose } });

      await waitFor(() => {
        expect(screen.getByText('add_account')).toBeInTheDocument();
      });

      const addButton = screen.getByText('add_account');
      await fireEvent.click(addButton);

      await waitFor(() => {
        expect(goto).toHaveBeenCalledWith('/auth/login?addAccount=true');
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });
});
