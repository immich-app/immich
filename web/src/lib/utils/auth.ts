import { browser } from '$app/environment';
import { purchaseStore } from '$lib/stores/purchase.store';
import {
  addSavedAccount,
  getCurrentServerUrl,
  getSavedAccountById,
  markAccountAsExpired,
  type SavedAccount,
} from '$lib/stores/saved-accounts.store';
import { preferences as preferences$, resetSavedUser, user as user$ } from '$lib/stores/user.store';
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
  const serverUrl = getCurrentServerUrl();

  const savedAccount: SavedAccount = {
    id: loginResponse.userId,
    name: loginResponse.name,
    email: loginResponse.userEmail,
    profileImagePath: loginResponse.profileImagePath || null,
    serverUrl,
    token: loginResponse.accessToken,
    isExpired: false,
  };

  await addSavedAccount(savedAccount);
  setCurrentSessionToken(loginResponse.accessToken);
};

// Save the current user as a saved account (from existing session)
export const saveCurrentAccount = async (): Promise<void> => {
  const user = get(user$);
  const token = getCurrentSessionToken();

  if (!user || !token) {
    return;
  }

  const serverUrl = getCurrentServerUrl();

  const savedAccount: SavedAccount = {
    id: user.id,
    name: user.name,
    email: user.email,
    profileImagePath: user.profileImagePath || null,
    serverUrl,
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

    // Reset current user state before loading new user
    resetSavedUser();

    // Load the new user data
    const newUser = await loadUser();

    if (!newUser) {
      // Something went wrong loading the user
      await markAccountAsExpired(accountId);
      delete defaults.headers[USER_TOKEN_HEADER];
      return false;
    }

    // Update the current session token
    setCurrentSessionToken(account.token);

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
};
