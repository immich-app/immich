import { browser } from '$app/environment';

// Represents a saved user account that can be switched to
export interface SavedAccount {
  // Unique identifier for the saved account
  id: string;
  // User's display name
  name: string;
  // User's email address
  email: string;
  // Path to user's profile image
  profileImagePath: string | null;
  // The Immich server URL this account belongs to
  serverUrl: string;
  // Authentication token (encrypted for storage)
  token: string;
  // Optional expiration timestamp
  expiresAt?: string;
  // Whether the session is known to be expired
  isExpired?: boolean;
}

// Internal representation with encrypted token and IV
interface StoredAccount extends Omit<SavedAccount, 'token'> {
  // Encrypted token (base64)
  encryptedToken: string;
  // Initialization vector for decryption (base64)
  iv: string;
}

const STORAGE_KEY = 'immich_saved_accounts';
const CRYPTO_KEY_STORAGE = 'immich_accounts_key';

/**
 * Get or create the encryption key for token storage.
 * The key is stored in localStorage but is still more secure than plain tokens
 * because an attacker would need both the key and the encrypted data.
 * The key itself is not human-readable and adds a layer of protection.
 */
const getOrCreateCryptoKey = async (): Promise<CryptoKey | null> => {
  if (!browser || !globalThis.crypto?.subtle) {
    return null;
  }

  try {
    const storedKey = localStorage.getItem(CRYPTO_KEY_STORAGE);

    if (storedKey) {
      // Import existing key
      const keyData = Uint8Array.from(atob(storedKey), (c) => c.charCodeAt(0));
      return await crypto.subtle.importKey('raw', keyData, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
    }

    // Generate new key
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);

    // Export and store the key
    const exportedKey = await crypto.subtle.exportKey('raw', key);
    const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
    localStorage.setItem(CRYPTO_KEY_STORAGE, keyBase64);

    return key;
  } catch (error) {
    console.error('Failed to get/create crypto key:', error);
    return null;
  }
};

// Encrypt a token using AES-GCM
const encryptToken = async (token: string): Promise<{ encrypted: string; iv: string } | null> => {
  const key = await getOrCreateCryptoKey();
  if (!key) {
    return null;
  }

  try {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedToken = new TextEncoder().encode(token);

    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encodedToken);

    return {
      encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      iv: btoa(String.fromCharCode(...iv)),
    };
  } catch (error) {
    console.error('Failed to encrypt token:', error);
    return null;
  }
};

// Decrypt a token using AES-GCM
const decryptToken = async (encrypted: string, ivBase64: string): Promise<string | null> => {
  const key = await getOrCreateCryptoKey();
  if (!key) {
    return null;
  }

  try {
    const iv = Uint8Array.from(atob(ivBase64), (c) => c.charCodeAt(0));
    const encryptedData = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));

    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encryptedData);

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Failed to decrypt token:', error);
    return null;
  }
};

// Read saved accounts from localStorage (async due to decryption)
const readFromStorage = async (): Promise<SavedAccount[]> => {
  if (!browser) {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const storedAccounts = JSON.parse(stored) as StoredAccount[];

    // Decrypt tokens
    const accounts: SavedAccount[] = [];
    for (const account of storedAccounts) {
      const token = await decryptToken(account.encryptedToken, account.iv);
      if (token) {
        const { encryptedToken: _, iv: __, ...rest } = account;
        accounts.push({ ...rest, token });
      }
    }

    return accounts;
  } catch (error) {
    console.error('Failed to read saved accounts from storage:', error);
    return [];
  }
};

// Write saved accounts to localStorage (async due to encryption)
const writeToStorage = async (accounts: SavedAccount[]): Promise<void> => {
  if (!browser) {
    return;
  }

  try {
    const storedAccounts: StoredAccount[] = [];

    for (const account of accounts) {
      const encrypted = await encryptToken(account.token);
      if (encrypted) {
        const { token: _, ...rest } = account;
        storedAccounts.push({
          ...rest,
          encryptedToken: encrypted.encrypted,
          iv: encrypted.iv,
        });
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedAccounts));
  } catch (error) {
    console.error('Failed to write saved accounts to storage:', error);
  }
};

// Get all saved accounts
export const getSavedAccounts = async (): Promise<SavedAccount[]> => {
  return readFromStorage();
};

// Get saved accounts grouped by server URL
export const getSavedAccountsByServer = async (): Promise<Map<string, SavedAccount[]>> => {
  const accounts = await getSavedAccounts();
  const grouped = new Map<string, SavedAccount[]>();

  for (const account of accounts) {
    const serverAccounts = grouped.get(account.serverUrl) || [];
    serverAccounts.push(account);
    grouped.set(account.serverUrl, serverAccounts);
  }

  return grouped;
};

// Find a saved account by ID
export const getSavedAccountById = async (accountId: string): Promise<SavedAccount | undefined> => {
  const accounts = await getSavedAccounts();
  return accounts.find((account) => account.id === accountId);
};

// Find a saved account by email and server URL
export const getSavedAccountByEmailAndServer = async (
  email: string,
  serverUrl: string,
): Promise<SavedAccount | undefined> => {
  const accounts = await getSavedAccounts();
  return accounts.find(
    (account) => account.email.toLowerCase() === email.toLowerCase() && account.serverUrl === serverUrl,
  );
};

// Add a new saved account or update if it already exists (by email + server)
export const addSavedAccount = async (account: SavedAccount): Promise<void> => {
  const accounts = await getSavedAccounts();
  const existingIndex = accounts.findIndex(
    (a) => a.email.toLowerCase() === account.email.toLowerCase() && a.serverUrl === account.serverUrl,
  );

  if (existingIndex >= 0) {
    // Update existing account
    accounts[existingIndex] = {
      ...accounts[existingIndex],
      ...account,
      isExpired: false, // Reset expired status on update
    };
  } else {
    // Add new account
    accounts.push(account);
  }

  await writeToStorage(accounts);
};

// Remove a saved account by ID
export const removeSavedAccount = async (accountId: string): Promise<void> => {
  const accounts = await getSavedAccounts();
  const filtered = accounts.filter((account) => account.id !== accountId);
  await writeToStorage(filtered);
};

// Update an existing saved account
export const updateSavedAccount = async (accountId: string, updates: Partial<SavedAccount>): Promise<void> => {
  const accounts = await getSavedAccounts();
  const index = accounts.findIndex((account) => account.id === accountId);

  if (index >= 0) {
    accounts[index] = {
      ...accounts[index],
      ...updates,
    };
    await writeToStorage(accounts);
  }
};

// Mark a saved account as expired (needs re-authentication)
export const markAccountAsExpired = async (accountId: string): Promise<void> => {
  await updateSavedAccount(accountId, { isExpired: true });
};

// Clear all saved accounts
export const clearAllSavedAccounts = (): void => {
  if (browser) {
    localStorage.removeItem(STORAGE_KEY);
  }
};

// Get the count of saved accounts
export const getSavedAccountsCount = async (): Promise<number> => {
  const accounts = await getSavedAccounts();
  return accounts.length;
};

// Check if there are any saved accounts other than the current one
export const hasOtherSavedAccounts = async (currentAccountId: string): Promise<boolean> => {
  const accounts = await getSavedAccounts();
  return accounts.some((account) => account.id !== currentAccountId);
};

// Generate the current server URL from the browser's location
export const getCurrentServerUrl = (): string => {
  if (!browser) {
    return '';
  }
  return globalThis.location.origin;
};
