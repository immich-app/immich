import type { ParamMatcher } from '@sveltejs/kit';

/* Returns true if the given param matches UUID format */
export const match: ParamMatcher = (param: string) => {
  return /^[\dA-Fa-f]{8}(?:\b-[\dA-Fa-f]{4}){3}\b-[\dA-Fa-f]{12}$/.test(param);
};
