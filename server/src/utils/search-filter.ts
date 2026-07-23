import { AuthDto } from 'src/dtos/auth.dto';
import { SearchFilter, SearchFilterBranch } from 'src/dtos/search.dto';
import { AssetVisibility } from 'src/enum';
import { requireElevatedPermission } from 'src/utils/access';

type EnumField = 'type' | 'visibility';
type EnumCondition<T> = { eq?: T; ne?: T; in?: T[]; notIn?: T[] };
type IdsFilterField = 'albumIds' | 'personIds' | 'tagIds';

const filterBranches = (filter: SearchFilter): SearchFilterBranch[] => [filter, ...(filter.or ?? [])];

/** Whether a row with `value` can satisfy the condition. A missing operator allows any value. */
const canMatch = <T>(condition: EnumCondition<T>, value: T): boolean =>
  (condition.eq === undefined || condition.eq === value) &&
  (condition.ne === undefined || condition.ne !== value) &&
  (condition.in === undefined || condition.in.includes(value)) &&
  (condition.notIn === undefined || !condition.notIn.includes(value));

const matchesOnly = <T>(condition: EnumCondition<T>, value: T, values: T[]): boolean =>
  values.every((other) => other === value || !canMatch(condition, other));

/**
 * The conditions that decide which `field` values the filter can return. A top-level condition decides alone, otherwise each branch itself.
 */
const decidingConditions = <F extends EnumField>(filter: SearchFilter, field: F) => {
  if (filter[field] !== undefined) {
    return [filter[field]];
  }

  return filterBranches(filter)
    .map((branch) => branch[field])
    .filter((condition) => condition !== undefined);
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

/** Whether the top-level visibility condition limits the filter to locked assets only. */
export const isLockedOnlyFilter = ({ visibility }: SearchFilter): boolean =>
  visibility !== undefined && matchesOnly(visibility, AssetVisibility.Locked, Object.values(AssetVisibility));

export const collectFilterIds = (filter: SearchFilter, field: IdsFilterField): string[] => {
  const ids = new Set<string>();

  for (const branch of filterBranches(filter)) {
    for (const operator of ['any', 'all', 'none'] as const) {
      for (const id of branch[field]?.[operator] ?? []) {
        ids.add(id);
      }
    }
  }

  return [...ids];
};

/** Whether the top level constrains results to specific `field` ids (`any`/`all`; `none` only excludes). */
export const hasTopLevelPositiveIdsConstraint = (filter: SearchFilter, field: IdsFilterField): boolean =>
  filter[field]?.any !== undefined || filter[field]?.all !== undefined;
