import { browser } from '$app/environment';
import { purchaseStore } from '$lib/stores/purchase.store';
import {
  addSavedAccount,
  clearActiveAccount,
  getActiveAccount,
  getSavedAccountByEmail,
  getSavedAccountById,
  markAccountAsExpired,
  setActiveAccountId,
  type SavedAccount,
} from '$lib/stores/saved-accounts.store';
import { preferences as preferences$, user as user$ } from '$lib/stores/user.store';
import { userInteraction } from '$lib/stores/user.svelte';
import type { LoginResponseDto } from '@immich/sdk';
import { defaults, getAboutInfo, getMyPreferences, getMyUser, getStorage, validateAccessToken } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import { DateTime } from 'luxon';
import { get } from 'svelte/store';
import { AppRoute } from '../constants';

export interface AuthOptions {
  admin?: true;
  public?: true;
}

// The header name for user token authentication
const USER_TOKEN_HEADER = 'x-immich-user-token';

// Check if we have authentication via header (set during account switching)
const hasAuthHeader = (): boolean => {
  return !!(defaults.headers && defaults.headers[USER_TOKEN_HEADER]);
};

export const loadUser = async () => {
  try {
    let user = get(user$);
    let preferences = get(preferences$);
    let serverInfo;

    // Load user if not cached AND we have auth (either cookie or header)
    if ((!user || !preferences) && (hasAuthCookie() || hasAuthHeader())) {
      [user, preferences, serverInfo] = await Promise.all([getMyUser(), getMyPreferences(), getAboutInfo()]);
      user$.set(user);
      preferences$.set(preferences);

      // Check for license status
      if (serverInfo.licensed || user.license?.activatedAt) {
        purchaseStore.setPurchaseStatus(true);
      }
    }
    return user;
  } catch {
    return null;
  }
};

const hasAuthCookie = (): boolean => {
  if (!browser) {
    return false;
  }

  for (const cookie of document.cookie.split('; ')) {
    const [name] = cookie.split('=');
    if (name === 'immich_is_authenticated') {
      return true;
    }
  }

  return false;
};

export const authenticate = async (url: URL, options?: AuthOptions) => {
  const { public: publicRoute, admin: adminRoute } = options || {};
  const user = await loadUser();

  if (publicRoute) {
    return;
  }

  if (!user) {
    redirect(302, `${AppRoute.AUTH_LOGIN}?continue=${encodeURIComponent(url.pathname + url.search)}`);
  }

  if (adminRoute && !user.isAdmin) {
    redirect(302, AppRoute.PHOTOS);
  }
};

export const requestServerInfo = async () => {
  if (get(user$)) {
    const data = await getStorage();
    userInteraction.serverInfo = data;
  }
};

export const getAccountAge = (): number => {
  const user = get(user$);

  if (!user) {
    return 0;
  }

  const createdDate = DateTime.fromISO(user.createdAt);
  const now = DateTime.now();
  const accountAge = now.diff(createdDate, 'days').days.toFixed(0);

  return Number(accountAge);
};

// Store to hold the current session's access token (for saving accounts)
let currentSessionToken: string | null = null;

// Set the current session token (called after login)
export const setCurrentSessionToken = (token: string): void => {
  currentSessionToken = token;
};

// Get the current session token
export const getCurrentSessionToken = (): string | null => {
  return currentSessionToken;
};

// Clear the current session token
export const clearCurrentSessionToken = (): void => {
  currentSessionToken = null;
};

/**
 * Save the current user as a saved account
 * @param loginResponse The response from the login endpoint
 */
export const saveCurrentAccountFromLogin = async (loginResponse: LoginResponseDto): Promise<void> => {
  const savedAccount: SavedAccount = {
    id: loginResponse.userId,
    name: loginResponse.name,
    email: loginResponse.userEmail,
    profileImagePath: loginResponse.profileImagePath || null,
    token: loginResponse.accessToken,
    isExpired: false,
  };

  await addSavedAccount(savedAccount);
  setCurrentSessionToken(loginResponse.accessToken);

  // Clear any active account since this login establishes a new cookie-based session.
  // The newly logged-in user is now authenticated via cookie, not header.
  clearActiveAccount();
  // Also clear the auth header in case one was set
  if (defaults.headers) {
    delete defaults.headers[USER_TOKEN_HEADER];
  }
};

// Save the current user as a saved account (from existing session)
export const saveCurrentAccount = async (): Promise<void> => {
  const user = get(user$);
  let token = getCurrentSessionToken();

  // If no in-memory token (e.g., after page reload), try to get it from saved accounts
  if (!token && user) {
    const existingAccount = await getSavedAccountByEmail(user.email);
    if (existingAccount && !existingAccount.isExpired) {
      token = existingAccount.token;
    }
  }

  if (!user || !token) {
    return;
  }

  const savedAccount: SavedAccount = {
    id: user.id,
    name: user.name,
    email: user.email,
    profileImagePath: user.profileImagePath || null,
    token,
    isExpired: false,
  };

  await addSavedAccount(savedAccount);
};

/**
 * Switch to a different saved account
 * @param accountId The ID of the account to switch to
 * @returns true if switch was successful, false if the session is invalid/expired
 */
export const switchToAccount = async (accountId: string): Promise<boolean> => {
  const account = await getSavedAccountById(accountId);

  if (!account) {
    console.error('Account not found:', accountId);
    return false;
  }

  // Save current account before switching
  await saveCurrentAccount();

  // Set the token header for API calls
  defaults.headers = defaults.headers || {};
  defaults.headers[USER_TOKEN_HEADER] = account.token;

  try {
    // Check if the token is still valid
    const response = await validateAccessToken();

    if (!response.authStatus) {
      // Token is invalid, mark account as expired
      await markAccountAsExpired(accountId);
      // Remove the header we just set
      delete defaults.headers[USER_TOKEN_HEADER];
      return false;
    }

    // Load the new user data directly (don't reset first to avoid UI flicker)
    // We bypass the cache check by fetching directly
    const [newUser, newPreferences, serverInfo] = await Promise.all([getMyUser(), getMyPreferences(), getAboutInfo()]);

    if (!newUser) {
      // Something went wrong loading the user
      await markAccountAsExpired(accountId);
      delete defaults.headers[USER_TOKEN_HEADER];
      return false;
    }

    // Update stores with the new user data
    user$.set(newUser);
    preferences$.set(newPreferences);

    // Check for license status
    if (serverInfo.licensed || newUser.license?.activatedAt) {
      purchaseStore.setPurchaseStatus(true);
    }

    // Update the current session token
    setCurrentSessionToken(account.token);

    // Persist the active account ID so it survives page refresh
    setActiveAccountId(accountId);

    return true;
  } catch (error) {
    console.error('Failed to switch account:', error);
    // Token is likely invalid, mark account as expired
    await markAccountAsExpired(accountId);
    // Remove the header we just set
    delete defaults.headers[USER_TOKEN_HEADER];
    return false;
  }
};

// Clear the auth header (called on logout)
export const clearAuthHeader = (): void => {
  if (defaults.headers) {
    delete defaults.headers[USER_TOKEN_HEADER];
  }
  clearCurrentSessionToken();
  // Clear the active account so page refresh won't try to restore it
  clearActiveAccount();
};

/**
 * Restore the active account session on page load.
 * This should be called during app initialization to restore
 * the token header if the user had switched accounts before refresh.
 * If the stored token is invalid/expired, it clears the active account.
 */
export const restoreActiveAccountSession = async (): Promise<boolean> => {
  const activeAccount = await getActiveAccount();

  if (!activeAccount) {
    return false;
  }

  // Temporarily set the token header to validate it
  defaults.headers = defaults.headers || {};
  defaults.headers[USER_TOKEN_HEADER] = activeAccount.token;

  try {
    // Validate the token before fully restoring the session
    const response = await validateAccessToken();

    if (!response.authStatus) {
      // Token is invalid/expired, clear the active account
      delete defaults.headers[USER_TOKEN_HEADER];
      await markAccountAsExpired(activeAccount.id);
      clearActiveAccount();
      return false;
    }

    // Token is valid, complete the restoration
    setCurrentSessionToken(activeAccount.token);
    return true;
  } catch {
    // Request failed, token is likely invalid
    delete defaults.headers[USER_TOKEN_HEADER];
    clearActiveAccount();
    return false;
  }
};
