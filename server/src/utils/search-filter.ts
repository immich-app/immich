import { AuthDto } from 'src/dtos/auth.dto';
import { SearchFilter, SearchFilterBranch } from 'src/dtos/search.dto';
import { AssetVisibility } from 'src/enum';
import { requireElevatedPermission } from 'src/utils/access';

type EnumField = 'type' | 'visibility';
type EnumValue = NonNullable<NonNullable<SearchFilterBranch[EnumField]>['eq']>;
type EnumCondition = { eq?: EnumValue; ne?: EnumValue; in?: EnumValue[]; notIn?: EnumValue[] };

/** Whether a row with `value` can satisfy the condition. A missing operator allows any value. */
const canMatch = (condition: EnumCondition, value: EnumValue): boolean =>
  (condition.eq === undefined || condition.eq === value) &&
  (condition.ne === undefined || condition.ne !== value) &&
  (condition.in === undefined || condition.in.includes(value)) &&
  (condition.notIn === undefined || !condition.notIn.includes(value));

/**
 * The conditions that decide which `field` values the filter can return. A top-level condition
 * decides alone, otherwise each branch itself.
 */
const decidingConditions = (filter: SearchFilter, field: EnumField): EnumCondition[] => {
  if (filter[field] !== undefined) {
    return [filter[field]];
  }

  return (filter.or ?? []).map((branch) => branch[field]).filter((condition) => condition !== undefined);
};

/**
 * Keeps locked assets out of search results unless the session is elevated: a filter that asks for
 * them is rejected with 401, and any other filter gets `visibility != locked` ANDed in.
 */
export const applyLockedVisibilityPolicy = (auth: AuthDto, filter: SearchFilter): SearchFilter => {
  if (auth.session?.hasElevatedPermission) {
    return filter;
  }

  if (decidingConditions(filter, 'visibility').some((condition) => canMatch(condition, AssetVisibility.Locked))) {
    requireElevatedPermission(auth);
  }

  if (filter.visibility !== undefined) {
    return filter;
  }

  return { ...filter, visibility: { ne: AssetVisibility.Locked } };
};
