import { UnauthorizedException } from '@nestjs/common';
import { AssetVisibility } from 'src/enum';
import { applyLockedVisibilityPolicy } from 'src/utils/search-filter';
import { AuthFactory } from 'test/factories/auth.factory';
import { describe, expect, it } from 'vitest';

const { Locked, Timeline, Archive } = AssetVisibility;

const elevatedAuth = () => AuthFactory.from().session({ hasElevatedPermission: true }).build();
const unelevatedAuth = () => AuthFactory.from().session().build();

describe(applyLockedVisibilityPolicy.name, () => {
  it('should let an elevated session query locked assets', () => {
    const filter = { visibility: { eq: Locked } };
    expect(applyLockedVisibilityPolicy(elevatedAuth(), filter)).toBe(filter);
  });

  it('should reject an unelevated session when any operator permits locked', () => {
    for (const visibility of [{ eq: Locked }, { ne: Timeline }, { in: [Locked, Timeline] }, { notIn: [Timeline] }]) {
      expect(() => applyLockedVisibilityPolicy(unelevatedAuth(), { visibility })).toThrow(UnauthorizedException);
    }
  });

  it('should keep a filter whose top-level visibility excludes locked', () => {
    for (const visibility of [{ eq: Timeline }, { ne: Locked }, { in: [Timeline, Archive] }, { notIn: [Locked] }]) {
      const filter = { visibility };
      expect(applyLockedVisibilityPolicy(unelevatedAuth(), filter)).toBe(filter);
    }
  });

  it('should let a safe top-level visibility decide over could-match branches', () => {
    const filter = { visibility: { ne: Locked }, or: [{ visibility: { eq: Locked } }] };
    expect(applyLockedVisibilityPolicy(unelevatedAuth(), filter)).toBe(filter);
  });

  it('should reject a branch that permits locked when the top level has no visibility', () => {
    const filter = { or: [{ city: { eq: 'Oslo' } }, { visibility: { in: [Locked, Timeline] } }] };
    expect(() => applyLockedVisibilityPolicy(unelevatedAuth(), filter)).toThrow(UnauthorizedException);
  });

  it('should otherwise inject visibility != locked without mutating the input', () => {
    const filter = { city: { eq: 'Oslo' }, visibility: undefined };
    expect(applyLockedVisibilityPolicy(unelevatedAuth(), filter)).toEqual({
      city: { eq: 'Oslo' },
      visibility: { ne: Locked },
    });
    expect(filter.visibility).toBeUndefined();

    const branched = { or: [{ isFavorite: { eq: true } }, { visibility: { eq: Timeline } }] };
    expect(applyLockedVisibilityPolicy(unelevatedAuth(), branched).visibility).toEqual({ ne: Locked });
  });
});
