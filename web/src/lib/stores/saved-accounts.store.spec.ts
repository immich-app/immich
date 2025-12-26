import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock browser environment
vi.mock('$app/environment', () => ({
  browser: true,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
});

// Mock Web Crypto API
const mockEncrypt = vi.fn();
const mockDecrypt = vi.fn();
const mockGenerateKey = vi.fn();
const mockExportKey = vi.fn();
const mockImportKey = vi.fn();

const mockSubtle = {
  encrypt: mockEncrypt,
  decrypt: mockDecrypt,
  generateKey: mockGenerateKey,
  exportKey: mockExportKey,
  importKey: mockImportKey,
};

const mockCryptoKey = { type: 'secret' };

Object.defineProperty(globalThis, 'crypto', {
  value: {
    subtle: mockSubtle,
    getRandomValues: vi.fn((arr: Uint8Array) => {
      // Fill with predictable values for testing
      for (let i = 0; i < arr.length; i++) {
        arr[i] = i;
      }
      return arr;
    }),
  },
});

// Import after mocks are set up
import {
  addSavedAccount,
  clearActiveAccount,
  clearAllSavedAccounts,
  getActiveAccount,
  getActiveAccountId,
  getSavedAccountByEmail,
  getSavedAccountById,
  getSavedAccounts,
  getSavedAccountsCount,
  hasOtherSavedAccounts,
  markAccountAsExpired,
  removeSavedAccount,
  setActiveAccountId,
  subscribeSavedAccounts,
  updateSavedAccount,
  type SavedAccount,
} from '$lib/stores/saved-accounts.store';

describe('saved-accounts.store', () => {
  const STORAGE_KEY = 'immich_saved_accounts';
  const CRYPTO_KEY_STORAGE = 'immich_accounts_key';
  const ACTIVE_ACCOUNT_KEY = 'immich_active_account_id';

  const createTestAccount = (overrides?: Partial<SavedAccount>): SavedAccount => ({
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    profileImagePath: '/path/to/profile.jpg',
    token: 'test-access-token-123',
    isExpired: false,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();

    // Setup crypto mocks for successful encryption/decryption
    mockGenerateKey.mockResolvedValue(mockCryptoKey);
    mockExportKey.mockResolvedValue(new ArrayBuffer(32)); // 256-bit key
    mockImportKey.mockResolvedValue(mockCryptoKey);

    // Mock encrypt to return predictable data
    mockEncrypt.mockImplementation(async (_algo: Algorithm, _key: CryptoKey, data: BufferSource) => {
      // Return the same data as "encrypted" for testing purposes
      return data;
    });

    // Mock decrypt to return the original data
    mockDecrypt.mockImplementation(async (_algo: Algorithm, _key: CryptoKey, data: BufferSource) => {
      return data;
    });
  });

  describe('crypto key management', () => {
    it('should generate a new crypto key if none exists', async () => {
      const account = createTestAccount();
      await addSavedAccount(account);

      expect(mockGenerateKey).toHaveBeenCalledWith({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
      expect(mockExportKey).toHaveBeenCalledWith('raw', mockCryptoKey);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(CRYPTO_KEY_STORAGE, expect.any(String));
    });

    it('should reuse existing crypto key from localStorage', async () => {
      // Simulate existing key in storage
      const existingKey = btoa(String.fromCharCode(...new Uint8Array(32)));
      localStorageMock.setItem(CRYPTO_KEY_STORAGE, existingKey);
      localStorageMock.getItem.mockReturnValueOnce(existingKey);

      const account = createTestAccount();
      await addSavedAccount(account);

      expect(mockImportKey).toHaveBeenCalled();
      expect(mockGenerateKey).not.toHaveBeenCalled();
    });
  });

  describe('getSavedAccounts', () => {
    it('should return empty array when no accounts are saved', async () => {
      const accounts = await getSavedAccounts();
      expect(accounts).toEqual([]);
    });

    it('should return saved accounts from localStorage', async () => {
      const account = createTestAccount();
      await addSavedAccount(account);

      const accounts = await getSavedAccounts();

      expect(accounts).toHaveLength(1);
      expect(accounts[0].id).toBe(account.id);
      expect(accounts[0].email).toBe(account.email);
      expect(accounts[0].name).toBe(account.name);
    });

    it('should return multiple saved accounts', async () => {
      const account1 = createTestAccount({ id: 'user-1', email: 'user1@example.com' });
      const account2 = createTestAccount({ id: 'user-2', email: 'user2@example.com' });

      await addSavedAccount(account1);
      await addSavedAccount(account2);

      const accounts = await getSavedAccounts();

      expect(accounts).toHaveLength(2);
    });
  });

  describe('addSavedAccount', () => {
    it('should add a new account to localStorage', async () => {
      const account = createTestAccount();

      await addSavedAccount(account);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));
    });

    it('should update existing account if email matches (case insensitive)', async () => {
      const account = createTestAccount({ email: 'test@example.com', name: 'Original Name' });
      await addSavedAccount(account);

      const updatedAccount = createTestAccount({
        email: 'TEST@EXAMPLE.COM',
        name: 'Updated Name',
        token: 'new-token',
      });
      await addSavedAccount(updatedAccount);

      const accounts = await getSavedAccounts();

      expect(accounts).toHaveLength(1);
      expect(accounts[0].name).toBe('Updated Name');
    });

    it('should reset isExpired flag when updating account', async () => {
      const account = createTestAccount({ isExpired: true });
      await addSavedAccount(account);

      const updatedAccount = createTestAccount({ token: 'new-token', isExpired: true });
      await addSavedAccount(updatedAccount);

      const accounts = await getSavedAccounts();

      expect(accounts[0].isExpired).toBe(false);
    });

    it('should encrypt token before storing', async () => {
      const account = createTestAccount();
      await addSavedAccount(account);

      expect(mockEncrypt).toHaveBeenCalled();
    });
  });

  describe('removeSavedAccount', () => {
    it('should remove account by ID', async () => {
      const account = createTestAccount();
      await addSavedAccount(account);

      await removeSavedAccount(account.id);

      const accounts = await getSavedAccounts();
      expect(accounts).toHaveLength(0);
    });

    it('should not affect other accounts', async () => {
      const account1 = createTestAccount({ id: 'user-1', email: 'user1@example.com' });
      const account2 = createTestAccount({ id: 'user-2', email: 'user2@example.com' });
      await addSavedAccount(account1);
      await addSavedAccount(account2);

      await removeSavedAccount('user-1');

      const accounts = await getSavedAccounts();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].id).toBe('user-2');
    });

    it('should do nothing if account ID not found', async () => {
      const account = createTestAccount();
      await addSavedAccount(account);

      await removeSavedAccount('non-existent-id');

      const accounts = await getSavedAccounts();
      expect(accounts).toHaveLength(1);
    });
  });

  describe('updateSavedAccount', () => {
    it('should update account fields', async () => {
      const account = createTestAccount();
      await addSavedAccount(account);

      await updateSavedAccount(account.id, { name: 'Updated Name' });

      const accounts = await getSavedAccounts();
      expect(accounts[0].name).toBe('Updated Name');
    });

    it('should not affect other fields when updating', async () => {
      const account = createTestAccount();
      await addSavedAccount(account);

      await updateSavedAccount(account.id, { name: 'Updated Name' });

      const accounts = await getSavedAccounts();
      expect(accounts[0].email).toBe(account.email);
      expect(accounts[0].profileImagePath).toBe(account.profileImagePath);
    });

    it('should do nothing if account ID not found', async () => {
      const account = createTestAccount();
      await addSavedAccount(account);

      await updateSavedAccount('non-existent-id', { name: 'Updated Name' });

      const accounts = await getSavedAccounts();
      expect(accounts[0].name).toBe(account.name);
    });
  });

  describe('getSavedAccountById', () => {
    it('should return account by ID', async () => {
      const account = createTestAccount();
      await addSavedAccount(account);

      const result = await getSavedAccountById(account.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(account.id);
    });

    it('should return undefined if account not found', async () => {
      const result = await getSavedAccountById('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('getSavedAccountByEmail', () => {
    it('should return account by email (case insensitive)', async () => {
      const account = createTestAccount({ email: 'Test@Example.com' });
      await addSavedAccount(account);

      const result = await getSavedAccountByEmail('test@example.com');

      expect(result).toBeDefined();
      expect(result?.email).toBe('Test@Example.com');
    });

    it('should return undefined if email not found', async () => {
      const result = await getSavedAccountByEmail('nonexistent@example.com');
      expect(result).toBeUndefined();
    });
  });

  describe('markAccountAsExpired', () => {
    it('should set isExpired to true', async () => {
      const account = createTestAccount({ isExpired: false });
      await addSavedAccount(account);

      await markAccountAsExpired(account.id);

      const accounts = await getSavedAccounts();
      expect(accounts[0].isExpired).toBe(true);
    });
  });

  describe('clearAllSavedAccounts', () => {
    it('should remove all saved accounts', async () => {
      await addSavedAccount(createTestAccount({ id: 'user-1', email: 'user1@example.com' }));
      await addSavedAccount(createTestAccount({ id: 'user-2', email: 'user2@example.com' }));

      await clearAllSavedAccounts();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    });
  });

  describe('getSavedAccountsCount', () => {
    it('should return correct count', async () => {
      await addSavedAccount(createTestAccount({ id: 'user-1', email: 'user1@example.com' }));
      await addSavedAccount(createTestAccount({ id: 'user-2', email: 'user2@example.com' }));

      const count = await getSavedAccountsCount();

      expect(count).toBe(2);
    });

    it('should return 0 when no accounts', async () => {
      const count = await getSavedAccountsCount();
      expect(count).toBe(0);
    });
  });

  describe('hasOtherSavedAccounts', () => {
    it('should return true when other accounts exist', async () => {
      await addSavedAccount(createTestAccount({ id: 'user-1', email: 'user1@example.com' }));
      await addSavedAccount(createTestAccount({ id: 'user-2', email: 'user2@example.com' }));

      const hasOther = await hasOtherSavedAccounts('user-1');

      expect(hasOther).toBe(true);
    });

    it('should return false when only current account exists', async () => {
      await addSavedAccount(createTestAccount({ id: 'user-1', email: 'user1@example.com' }));

      const hasOther = await hasOtherSavedAccounts('user-1');

      expect(hasOther).toBe(false);
    });

    it('should return false when no accounts exist', async () => {
      const hasOther = await hasOtherSavedAccounts('user-1');
      expect(hasOther).toBe(false);
    });
  });

  describe('subscribeSavedAccounts', () => {
    it('should call listener immediately with current accounts', async () => {
      const account = createTestAccount();
      await addSavedAccount(account);

      const listener = vi.fn();
      subscribeSavedAccounts(listener);

      // Wait for the async call
      await vi.waitFor(() => expect(listener).toHaveBeenCalled());

      expect(listener).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: account.id })]));
    });

    it('should return unsubscribe function', async () => {
      const listener = vi.fn();
      const unsubscribe = subscribeSavedAccounts(listener);

      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('active account management', () => {
    describe('getActiveAccountId', () => {
      it('should return null when no active account', () => {
        const result = getActiveAccountId();
        expect(result).toBeNull();
      });

      it('should return stored active account ID', () => {
        localStorageMock.setItem(ACTIVE_ACCOUNT_KEY, 'active-user-id');
        localStorageMock.getItem.mockReturnValueOnce('active-user-id');

        const result = getActiveAccountId();
        expect(result).toBe('active-user-id');
      });
    });

    describe('setActiveAccountId', () => {
      it('should store account ID in localStorage', () => {
        setActiveAccountId('test-account-id');

        expect(localStorageMock.setItem).toHaveBeenCalledWith(ACTIVE_ACCOUNT_KEY, 'test-account-id');
      });

      it('should remove from localStorage when set to null', () => {
        setActiveAccountId(null);

        expect(localStorageMock.removeItem).toHaveBeenCalledWith(ACTIVE_ACCOUNT_KEY);
      });
    });

    describe('getActiveAccount', () => {
      it('should return null when no active account ID', async () => {
        const result = await getActiveAccount();
        expect(result).toBeNull();
      });

      it('should return account details when active account exists', async () => {
        const account = createTestAccount({ id: 'active-user-id' });
        await addSavedAccount(account);

        // Mock getItem for ACTIVE_ACCOUNT_KEY
        localStorageMock.getItem.mockImplementation((key: string) => {
          if (key === ACTIVE_ACCOUNT_KEY) {
            return 'active-user-id';
          }
          return localStorageMock.store[key] ?? null;
        });

        const result = await getActiveAccount();
        expect(result?.id).toBe('active-user-id');
      });
    });

    describe('clearActiveAccount', () => {
      it('should remove active account from localStorage', () => {
        setActiveAccountId('test-account-id');
        clearActiveAccount();

        expect(localStorageMock.removeItem).toHaveBeenCalledWith(ACTIVE_ACCOUNT_KEY);
      });
    });
  });

  describe('error handling', () => {
    it('should handle crypto encryption failure gracefully', async () => {
      mockEncrypt.mockRejectedValueOnce(new Error('Encryption failed'));

      const account = createTestAccount();
      await addSavedAccount(account);

      // Should not throw, but account may not be saved
      const accounts = await getSavedAccounts();
      expect(accounts).toHaveLength(0);
    });

    it('should handle crypto decryption failure gracefully', async () => {
      const account = createTestAccount();
      await addSavedAccount(account);

      // Now make decryption fail for subsequent reads
      mockDecrypt.mockRejectedValue(new Error('Decryption failed'));

      const accounts = await getSavedAccounts();
      // Account should be filtered out due to decryption failure
      expect(accounts).toHaveLength(0);
    });

    it('should handle JSON parse errors gracefully', async () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid-json');

      const accounts = await getSavedAccounts();
      expect(accounts).toEqual([]);
    });
  });
});
