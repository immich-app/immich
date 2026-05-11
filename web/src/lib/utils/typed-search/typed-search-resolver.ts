import { createFilterState, type FilterState } from '$lib/components/filter-panel/filter-panel';
import { getFilterSuggestions, getSearchSuggestions, searchPerson, SearchSuggestionType } from '@immich/sdk';
import type {
  TypedSearchIssue,
  TypedSearchParseResult,
  TypedSearchResolutionToken,
  TypedSearchScalarToken,
} from './typed-search-parser';

export type TypedSearchChoice = {
  tokenRaw: string;
  key: 'person' | 'tag' | 'camera';
  id?: string;
  label: string;
  value: string;
  field?: 'make' | 'model';
};

export type TypedSearchResolveContext = {
  spaceId?: string;
  signal?: AbortSignal;
  selectedChoices?: Map<string, TypedSearchChoice>;
};

export type TypedSearchResolveResult =
  | {
      ok: true;
      queryText: string;
      filters: FilterState;
      personNames: Map<string, string>;
      tagNames: Map<string, string>;
    }
  | {
      ok: false;
      queryText: string;
      issues: TypedSearchIssue[];
      choices: TypedSearchChoice[];
    };

type PersonSuggestion = {
  id: string;
  filterId?: string | null;
  name?: string | null;
  primaryProfile?: { type?: string; id?: string; spaceId?: string };
};

type TagSuggestion = {
  id: string;
  name?: string | null;
  value?: string | null;
};

export async function resolveTypedSearchFilters(
  parsed: TypedSearchParseResult,
  context: TypedSearchResolveContext = {},
): Promise<TypedSearchResolveResult> {
  try {
    return await resolveTypedSearchFiltersInternal(parsed, context);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }

    return {
      ok: false,
      queryText: parsed.queryText,
      issues: [
        {
          code: 'resolver-error',
          raw: parsed.raw,
          message: error instanceof Error ? error.message : 'Unable to resolve search filters',
        },
      ],
      choices: [],
    };
  }
}

async function resolveTypedSearchFiltersInternal(
  parsed: TypedSearchParseResult,
  context: TypedSearchResolveContext,
): Promise<TypedSearchResolveResult> {
  const filters = createFilterState();
  const issues: TypedSearchIssue[] = [...parsed.issues];
  const choices: TypedSearchChoice[] = [];
  const personNames = new Map<string, string>();
  const tagNames = new Map<string, string>();

  if (issues.length > 0) {
    return { ok: false, queryText: parsed.queryText, issues, choices };
  }

  const countryToken = parsed.scalarTokens.find((token) => token.key === 'country');
  const cityToken = parsed.scalarTokens.find((token) => token.key === 'city');
  const rawTokenCounts = countResolutionTokenRawValues(parsed.resolutionTokens);
  const unresolvedTokens = parsed.resolutionTokens.filter(
    (token) => !getSelectedChoice(context, token, rawTokenCounts),
  );
  const needsSuggestions = unresolvedTokens.some(
    (token) => token.key === 'tag' || token.key === 'camera' || (token.key === 'person' && context.spaceId),
  );
  const needsFilterSuggestions = needsSuggestions || countryToken !== undefined;
  const suggestions = needsFilterSuggestions
    ? await getFilterSuggestions(suggestionScope(context), { signal: context.signal })
    : undefined;
  const canonicalScalarValues = new Map<TypedSearchScalarToken['key'], string>();
  if (countryToken) {
    const country = canonicalExactMatch(suggestions?.countries ?? [], String(countryToken.normalizedValue));
    canonicalScalarValues.set('country', country);
  }

  const country = countryToken ? canonicalScalarValues.get('country') : undefined;
  const citySuggestions = cityToken
    ? await getSearchSuggestions(
        {
          $type: SearchSuggestionType.City,
          ...(country ? { country } : {}),
          ...suggestionScope(context),
        },
        { signal: context.signal },
      )
    : [];
  if (cityToken) {
    const city = canonicalExactMatch(citySuggestions.filter(isString), String(cityToken.normalizedValue));
    canonicalScalarValues.set('city', city);
  }

  const cameraModels = unresolvedTokens.some((token) => token.key === 'camera')
    ? await getSearchSuggestions(
        { $type: SearchSuggestionType.CameraModel, ...suggestionScope(context) },
        { signal: context.signal },
      )
    : [];

  for (const token of parsed.scalarTokens) {
    applyScalar(filters, token, canonicalScalarValues.get(token.key));
  }

  for (const token of parsed.resolutionTokens) {
    const selectedChoice = getSelectedChoice(context, token, rawTokenCounts);
    if (selectedChoice) {
      applySelectedChoice(selectedChoice, filters, personNames, tagNames);
      continue;
    }

    if (token.key === 'person') {
      if (context.spaceId && suggestions) {
        resolvePersonTokenFromSuggestions(token, suggestions.people, filters, personNames, issues, choices, 'space');
        continue;
      }

      const people = await searchPerson({ name: token.value, withHidden: false }, { signal: context.signal });
      resolvePersonTokenFromSuggestions(token, people, filters, personNames, issues, choices, 'global');
      continue;
    }

    if (token.key === 'tag' && suggestions) {
      resolveTagToken(token, suggestions.tags, filters, tagNames, issues, choices);
      continue;
    }

    if (token.key === 'camera' && suggestions) {
      resolveCameraToken(token, suggestions.cameraMakes, cameraModels, filters, issues, choices);
    }
  }

  return issues.length > 0
    ? { ok: false, queryText: parsed.queryText, issues, choices }
    : { ok: true, queryText: parsed.queryText, filters, personNames, tagNames };
}

function suggestionScope(context: TypedSearchResolveContext) {
  return context.spaceId ? { spaceId: context.spaceId } : { withSharedSpaces: true };
}

function countResolutionTokenRawValues(tokens: TypedSearchResolutionToken[]) {
  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token.raw, (counts.get(token.raw) ?? 0) + 1);
  }
  return counts;
}

function getSelectedChoice(
  context: TypedSearchResolveContext,
  token: TypedSearchResolutionToken,
  rawTokenCounts: Map<string, number>,
) {
  const identityChoice = context.selectedChoices?.get(token.identity);
  if (identityChoice) {
    return identityChoice;
  }
  if (rawTokenCounts.get(token.raw) !== 1) {
    return undefined;
  }
  return context.selectedChoices?.get(token.raw);
}

function applyScalar(filters: FilterState, token: TypedSearchScalarToken, canonicalValue?: string) {
  switch (token.key) {
    case 'from': {
      filters.dateAfter = String(token.normalizedValue);
      return;
    }
    case 'to': {
      filters.dateBefore = String(token.normalizedValue);
      return;
    }
    case 'city': {
      filters.city = canonicalValue ?? String(token.normalizedValue);
      return;
    }
    case 'country': {
      filters.country = canonicalValue ?? String(token.normalizedValue);
      return;
    }
    case 'type': {
      filters.mediaType = token.normalizedValue as FilterState['mediaType'];
      return;
    }
    case 'favorite': {
      filters.isFavorite = Boolean(token.normalizedValue);
      return;
    }
    case 'rating': {
      filters.rating = Number(token.normalizedValue);
      return;
    }
  }
}

function applySelectedChoice(
  choice: TypedSearchChoice,
  filters: FilterState,
  personNames: Map<string, string>,
  tagNames: Map<string, string>,
) {
  if (choice.key === 'person' && choice.id) {
    filters.personIds.push(choice.id);
    personNames.set(choice.id, choice.label);
    return;
  }

  if (choice.key === 'tag' && choice.id) {
    filters.tagIds.push(choice.id);
    tagNames.set(choice.id, choice.label);
    return;
  }

  if (choice.key === 'camera' && choice.field) {
    filters[choice.field] = choice.label;
  }
}

function resolvePersonTokenFromSuggestions(
  token: TypedSearchResolutionToken,
  people: PersonSuggestion[],
  filters: FilterState,
  personNames: Map<string, string>,
  issues: TypedSearchIssue[],
  choices: TypedSearchChoice[],
  scope: 'global' | 'space',
) {
  const matches = people
    .filter((person) => getPersonLabel(person))
    .filter((person) => matchesValue(getPersonLabel(person), token.value));
  if (matches.length === 1) {
    const match = matches[0];
    const id = getPersonFilterId(match, scope);
    const label = getPersonLabel(match);
    filters.personIds.push(id);
    personNames.set(id, label);
    return;
  }

  if (matches.length === 0) {
    issues.push(noMatchIssue(token, 'person'));
    return;
  }

  issues.push(ambiguousIssue(token, 'person'));
  choices.push(
    ...matches.map((person) => {
      const id = getPersonFilterId(person, scope);
      return {
        tokenRaw: token.raw,
        key: 'person' as const,
        id,
        label: getPersonLabel(person),
        value: token.value,
      };
    }),
  );
}

function getPersonLabel(person: Pick<PersonSuggestion, 'name'>) {
  return person.name?.trim() ?? '';
}

function getPersonFilterId(person: PersonSuggestion, scope: 'global' | 'space') {
  if (scope === 'space') {
    return person.id;
  }

  if (person.filterId) {
    return person.filterId;
  }

  if (person.primaryProfile?.type === 'space-person' && person.primaryProfile.id) {
    return `space-person:${person.primaryProfile.id}`;
  }

  if (person.primaryProfile?.type === 'user-person' && person.primaryProfile.id) {
    return `person:${person.primaryProfile.id}`;
  }

  if (!person.id.startsWith('person:') && !person.id.startsWith('space-person:')) {
    return `person:${person.id}`;
  }

  return person.id;
}

function resolveTagToken(
  token: TypedSearchResolutionToken,
  tags: TagSuggestion[],
  filters: FilterState,
  tagNames: Map<string, string>,
  issues: TypedSearchIssue[],
  choices: TypedSearchChoice[],
) {
  const matches = tags.filter((tag) => matchesValue(tagLabel(tag), token.value));
  if (matches.length === 1) {
    const match = matches[0];
    const label = tagLabel(match);
    filters.tagIds.push(match.id);
    tagNames.set(match.id, label);
    return;
  }

  if (matches.length === 0) {
    issues.push(noMatchIssue(token, 'tag'));
    return;
  }

  issues.push(ambiguousIssue(token, 'tag'));
  choices.push(
    ...matches.map((tag) => ({
      tokenRaw: token.raw,
      key: 'tag' as const,
      id: tag.id,
      label: tagLabel(tag),
      value: token.value,
    })),
  );
}

function resolveCameraToken(
  token: TypedSearchResolutionToken,
  cameraMakes: string[],
  cameraModels: string[],
  filters: FilterState,
  issues: TypedSearchIssue[],
  choices: TypedSearchChoice[],
) {
  const makeMatches = cameraMakes.filter((make) => matchesValue(make, token.value));
  const modelMatches = cameraModels.filter((model) => matchesValue(model, token.value));
  const matches = [
    ...makeMatches.map((label) => ({ field: 'make' as const, label })),
    ...modelMatches.map((label) => ({ field: 'model' as const, label })),
  ];

  if (matches.length === 1) {
    filters[matches[0].field] = matches[0].label;
    return;
  }

  if (matches.length === 0) {
    issues.push(noMatchIssue(token, 'camera'));
    return;
  }

  issues.push(ambiguousIssue(token, 'camera'));
  choices.push(
    ...matches.map((match) => ({
      tokenRaw: token.raw,
      key: 'camera' as const,
      field: match.field,
      label: match.label,
      value: token.value,
    })),
  );
}

function matchesValue(candidate: string, value: string): boolean {
  return candidate.toLowerCase().includes(value.toLowerCase());
}

function canonicalExactMatch(candidates: string[], value: string): string {
  return candidates.find((candidate) => candidate.toLowerCase() === value.toLowerCase()) ?? value;
}

function isString(value: string | null): value is string {
  return typeof value === 'string';
}

function tagLabel(tag: TagSuggestion): string {
  return tag.value || tag.name || tag.id;
}

function noMatchIssue(token: TypedSearchResolutionToken, key: 'person' | 'tag' | 'camera'): TypedSearchIssue {
  return {
    code: 'no-match',
    key,
    raw: token.raw,
    value: token.value,
    message: `No ${key} found for "${token.value}"`,
  };
}

function ambiguousIssue(token: TypedSearchResolutionToken, key: 'person' | 'tag' | 'camera'): TypedSearchIssue {
  return {
    code: 'ambiguous',
    key,
    raw: token.raw,
    value: token.value,
    message: `Choose a ${key} for "${token.value}"`,
  };
}
