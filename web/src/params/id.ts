import { UUID_REGEX } from '$lib/constants';
import type { ParamMatcher } from '@sveltejs/kit';

/* Returns true if the given param matches UUID format */
export const match: ParamMatcher = (param: string) => {
  return UUID_REGEX.test(param);
};
