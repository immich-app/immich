import type { ParamMatcher } from '@sveltejs/kit';

export const match: ParamMatcher = (param: string) => {
  return param === 'album' || param === 'individual';
};
