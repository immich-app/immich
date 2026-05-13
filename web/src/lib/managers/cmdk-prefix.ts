import { comparePeopleByFavoriteAndName } from '$lib/utils/people-utils';
import type { PersonResponseDto } from '@immich/sdk';

export type Scope = 'all' | 'people' | 'tags' | 'collections' | 'nav';
export type ParsedQuery = { scope: Scope; payload: string };

const PREFIX_MAP: Record<string, Scope> = {
  '@': 'people',
  '#': 'tags',
  '/': 'collections',
  '>': 'nav',
};

export function parseScope(rawText: string): ParsedQuery {
  const text = rawText.trim();
  if (text.length === 0) {
    return { scope: 'all', payload: '' };
  }
  const scope = PREFIX_MAP[text[0]];
  if (!scope) {
    return { scope: 'all', payload: text };
  }
  return { scope, payload: text.slice(1).trim() };
}

/**
 * Sort comparator for the bare-`@` suggestions list.
 * Keys (in priority order): favorite first, named people alpha, unnamed people, id alpha.
 */
export function personSuggestionsComparator(a: PersonResponseDto, b: PersonResponseDto): number {
  return comparePeopleByFavoriteAndName(a, b);
}
