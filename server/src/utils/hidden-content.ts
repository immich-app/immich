import { BadRequestException } from '@nestjs/common';
import type { AuthDto } from 'src/dtos/auth.dto';

export type SuppressionScope = 'owned' | 'visible';

export type SuppressionPreferences = {
  tagIds: string[];
  personIds: string[];
  scope: SuppressionScope;
};

export type HiddenContentFilter = SuppressionPreferences & {
  userId: string;
  includeNsfw: boolean;
};

export type HiddenContentQueryOptions = {
  excludeNsfw?: boolean;
  hiddenContent?: HiddenContentFilter;
  onlyHiddenContent?: HiddenContentFilter;
};

export const emptySuppressionPreferences = (): SuppressionPreferences => ({
  tagIds: [],
  personIds: [],
  scope: 'owned',
});

export const hasHiddenContentFilter = (filter?: HiddenContentFilter): filter is HiddenContentFilter => {
  return !!filter && (filter.includeNsfw || filter.tagIds.length > 0 || filter.personIds.length > 0);
};

export const hasSuppressionPreferences = (
  preferences?: SuppressionPreferences,
): preferences is SuppressionPreferences => {
  return !!preferences && (preferences.tagIds.length > 0 || preferences.personIds.length > 0);
};

export const getHiddenContentQueryOptions = (auth: AuthDto): HiddenContentQueryOptions => {
  if (auth.hiddenContent) {
    return { hiddenContent: auth.hiddenContent };
  }

  return auth.hideNsfwAssets ? { excludeNsfw: true } : {};
};

export const getSuppressedOnlyQueryOptions = (auth: AuthDto): HiddenContentQueryOptions => {
  return { onlyHiddenContent: auth.suppressedContent ?? emptyHiddenContentFilter(auth.user.id) };
};

export const requireSuppressedOnlyAccess = (auth: AuthDto, suppressedOnly?: boolean) => {
  if (!suppressedOnly) {
    return;
  }

  if (auth.sharedLink) {
    throw new BadRequestException('suppressedOnly is not available for shared links');
  }

  if (!auth.session?.hasElevatedPermission) {
    throw new BadRequestException('suppressedOnly requires an elevated session');
  }
};

export const getPrivacyQueryOptions = (auth: AuthDto, suppressedOnly?: boolean): HiddenContentQueryOptions => {
  requireSuppressedOnlyAccess(auth, suppressedOnly);
  return suppressedOnly ? getSuppressedOnlyQueryOptions(auth) : getHiddenContentQueryOptions(auth);
};

export const emptyHiddenContentFilter = (userId: string): HiddenContentFilter => ({
  userId,
  includeNsfw: false,
  ...emptySuppressionPreferences(),
});
