import { UnauthorizedException } from '@nestjs/common';
import { SearchFilter } from 'src/dtos/search.dto';
import { AssetVisibility } from 'src/enum';
import {
  applyLockedVisibilityPolicy,
  collectFilterIds,
  hasTopLevelPositiveIdsConstraint,
  isLockedOnlyFilter,
} from 'src/utils/search-filter';
import { AuthFactory } from 'test/factories/auth.factory';
import { describe, expect, it } from 'vitest';

const { Locked, Timeline, Archive, Hidden } = AssetVisibility;

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

describe(isLockedOnlyFilter.name, () => {
  it('should detect provably locked-only filters', () => {
    expect(isLockedOnlyFilter({ visibility: { eq: Locked } })).toBe(true);
    expect(isLockedOnlyFilter({ visibility: { in: [Locked] } })).toBe(true);
    expect(isLockedOnlyFilter({ visibility: { notIn: [Timeline, Archive, Hidden] } })).toBe(true);
  });

  it('should not match other filters', () => {
    expect(isLockedOnlyFilter({ visibility: { ne: Locked } })).toBe(false);
    expect(isLockedOnlyFilter({ visibility: { in: [Locked, Timeline] } })).toBe(false);
    expect(isLockedOnlyFilter({ or: [{ visibility: { eq: Locked } }] })).toBe(false);
    expect(isLockedOnlyFilter({})).toBe(false);
  });
});

describe(collectFilterIds.name, () => {
  it('should union and dedupe ids across operators and branches', () => {
    const [albumA, albumB, albumC] = [
      '00000000-0000-4000-8000-00000000000a',
      '00000000-0000-4000-8000-00000000000b',
      '00000000-0000-4000-8000-00000000000c',
    ];
    const filter: SearchFilter = {
      albumIds: { any: [albumA], none: [albumB] },
      or: [{ albumIds: { all: [albumC, albumA] } }, { city: { eq: 'Oslo' } }],
    };
    expect(collectFilterIds(filter, 'albumIds').toSorted()).toEqual([albumA, albumB, albumC]);
    expect(collectFilterIds({}, 'albumIds')).toEqual([]);
  });

  it('should only collect ids of the requested field', () => {
    const albumId = '00000000-0000-4000-8000-00000000000a';
    const personId = '00000000-0000-4000-8000-00000000000b';
    const filter = { albumIds: { any: [albumId] }, personIds: { any: [personId] } };
    expect(collectFilterIds(filter, 'personIds')).toEqual([personId]);
  });
});

describe(hasTopLevelPositiveIdsConstraint.name, () => {
  it('should detect only top-level any/all constraints', () => {
    const albumId = '00000000-0000-4000-8000-00000000000a';
    expect(hasTopLevelPositiveIdsConstraint({ albumIds: { any: [albumId] } }, 'albumIds')).toBe(true);
    expect(hasTopLevelPositiveIdsConstraint({ albumIds: { all: [albumId] } }, 'albumIds')).toBe(true);
    expect(hasTopLevelPositiveIdsConstraint({ albumIds: { none: [albumId] } }, 'albumIds')).toBe(false);
    expect(hasTopLevelPositiveIdsConstraint({ or: [{ albumIds: { any: [albumId] } }] }, 'albumIds')).toBe(false);
    expect(hasTopLevelPositiveIdsConstraint({ albumIds: { any: [albumId] } }, 'tagIds')).toBe(false);
    expect(hasTopLevelPositiveIdsConstraint({}, 'albumIds')).toBe(false);
  });
});
