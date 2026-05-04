export type TypedSearchFilterKey =
  | 'person'
  | 'tag'
  | 'from'
  | 'to'
  | 'city'
  | 'country'
  | 'camera'
  | 'type'
  | 'favorite'
  | 'rating';

export type TypedSearchResolutionKey = 'person' | 'tag' | 'camera';

export type TypedSearchIssueCode =
  | 'unknown-key'
  | 'empty-value'
  | 'invalid-date'
  | 'invalid-range'
  | 'invalid-rating'
  | 'invalid-type'
  | 'invalid-favorite'
  | 'duplicate-filter'
  | 'unterminated-quote'
  | 'escaped-quote'
  | 'no-match'
  | 'ambiguous'
  | 'resolver-error';

export type TypedSearchIssue = {
  code: TypedSearchIssueCode;
  message: string;
  raw: string;
  key?: string;
  value?: string;
};

export type TypedSearchScalarToken = {
  kind: 'scalar';
  key: Exclude<TypedSearchFilterKey, TypedSearchResolutionKey>;
  raw: string;
  value: string;
  normalizedValue: string | number | boolean;
};

export type TypedSearchResolutionToken = {
  kind: 'resolution';
  key: TypedSearchResolutionKey;
  raw: string;
  value: string;
};

export type TypedSearchDisplayToken = {
  raw: string;
  key: string;
  value: string;
  status: 'recognized' | 'pending-entity' | 'resolved-entity' | 'error';
  issue?: TypedSearchIssue;
};

export type TypedSearchParseResult = {
  raw: string;
  queryText: string;
  scalarTokens: TypedSearchScalarToken[];
  resolutionTokens: TypedSearchResolutionToken[];
  displayTokens: TypedSearchDisplayToken[];
  issues: TypedSearchIssue[];
};

type ParsedPiece = {
  raw: string;
  key?: string;
  value: string;
  issue?: 'unterminated-quote' | 'escaped-quote';
};

type ScalarResult =
  | { token: TypedSearchScalarToken }
  | {
      issue: TypedSearchIssue;
    };

const FILTER_KEYS = new Set<TypedSearchFilterKey>([
  'person',
  'tag',
  'from',
  'to',
  'city',
  'country',
  'camera',
  'type',
  'favorite',
  'rating',
]);

const RESOLUTION_KEYS = new Set<TypedSearchResolutionKey>(['person', 'tag', 'camera']);
const REPEATABLE_KEYS = new Set<TypedSearchFilterKey>(['person', 'tag']);
const FILTER_KEY_ALIASES: Record<string, TypedSearchFilterKey> = {
  people: 'person',
  tags: 'tag',
};

export function parseTypedSearch(raw: string): TypedSearchParseResult {
  const pieces = splitSearch(raw);
  const queryParts: string[] = [];
  const scalarTokens: TypedSearchScalarToken[] = [];
  const resolutionTokens: TypedSearchResolutionToken[] = [];
  const displayTokens: TypedSearchDisplayToken[] = [];
  const issues: TypedSearchIssue[] = [];
  const seenScalarKeys = new Set<string>();

  for (const piece of pieces) {
    if (!piece.key) {
      queryParts.push(piece.raw);
      continue;
    }

    const key = normalizeFilterKey(piece.key);
    if (!key) {
      const issue = makeIssue('unknown-key', piece.raw, `Unknown filter "${piece.key}"`, piece.key, piece.value);
      issues.push(issue);
      displayTokens.push({ raw: piece.raw, key: piece.key, value: piece.value, status: 'error', issue });
      continue;
    }

    if (piece.issue) {
      const issue = makeIssue(piece.issue, piece.raw, issueMessage(piece.issue, key), key, piece.value);
      issues.push(issue);
      displayTokens.push({ raw: piece.raw, key, value: piece.value, status: 'error', issue });
      continue;
    }

    if (!piece.value.trim()) {
      const issue = makeIssue('empty-value', piece.raw, `Filter "${key}" needs a value`, key, piece.value);
      issues.push(issue);
      displayTokens.push({ raw: piece.raw, key, value: piece.value, status: 'error', issue });
      continue;
    }

    if (!REPEATABLE_KEYS.has(key) && seenScalarKeys.has(key)) {
      const issue = makeIssue('duplicate-filter', piece.raw, `Filter "${key}" can only be used once`, key, piece.value);
      issues.push(issue);
      displayTokens.push({ raw: piece.raw, key, value: piece.value, status: 'error', issue });
      continue;
    }

    if (RESOLUTION_KEYS.has(key as TypedSearchResolutionKey)) {
      resolutionTokens.push({
        kind: 'resolution',
        key: key as TypedSearchResolutionKey,
        raw: piece.raw,
        value: piece.value,
      });
      displayTokens.push({ raw: piece.raw, key, value: piece.value, status: 'pending-entity' });
      continue;
    }

    seenScalarKeys.add(key);
    const scalar = normalizeScalarToken(key, piece.raw, piece.value);
    if ('issue' in scalar) {
      issues.push(scalar.issue);
      displayTokens.push({ raw: piece.raw, key, value: piece.value, status: 'error', issue: scalar.issue });
      continue;
    }

    scalarTokens.push(scalar.token);
    displayTokens.push({ raw: piece.raw, key, value: piece.value, status: 'recognized' });
  }

  const rangeIssue = validateDateRange(scalarTokens);
  if (rangeIssue) {
    issues.push(rangeIssue);
    const token = displayTokens.find((item) => item.key === 'from');
    if (token) {
      token.status = 'error';
      token.issue = rangeIssue;
    }
  }

  return {
    raw,
    queryText: queryParts.join(' ').trim().replaceAll(/\s+/g, ' '),
    scalarTokens,
    resolutionTokens,
    displayTokens,
    issues,
  };
}

function normalizeFilterKey(rawKey: string): TypedSearchFilterKey | undefined {
  const lowerKey = rawKey.toLowerCase();
  const aliasedKey = FILTER_KEY_ALIASES[lowerKey] ?? lowerKey;
  return FILTER_KEYS.has(aliasedKey as TypedSearchFilterKey) ? (aliasedKey as TypedSearchFilterKey) : undefined;
}

function splitSearch(raw: string): ParsedPiece[] {
  const parts: string[] = [];
  let current = '';
  let inQuote = false;

  for (let index = 0; index < raw.length; index++) {
    const char = raw[index];
    if (char === '"' && raw[index - 1] !== '\\') {
      inQuote = !inQuote;
    }

    if (/\s/.test(char) && !inQuote) {
      if (current) {
        parts.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current) {
    parts.push(current);
  }

  return parts.map((part) => parsePiece(part));
}

function parsePiece(raw: string): ParsedPiece {
  if (raw.includes('://')) {
    return { raw, value: '' };
  }

  const match = /^([A-Za-z]+):(.*)$/s.exec(raw);
  if (!match) {
    return { raw, value: '' };
  }

  const [, key, rawValue] = match;
  if (!rawValue.startsWith('"')) {
    return { raw, key, value: rawValue };
  }

  const closingQuoteIndex = findClosingQuote(rawValue);
  const value = closingQuoteIndex === -1 ? rawValue.slice(1) : rawValue.slice(1, closingQuoteIndex);
  if (value.includes(String.raw`\"`)) {
    return { raw, key, value, issue: 'escaped-quote' };
  }
  if (closingQuoteIndex === -1) {
    return { raw, key, value, issue: 'unterminated-quote' };
  }

  return { raw, key, value };
}

function findClosingQuote(value: string): number {
  for (let index = 1; index < value.length; index++) {
    if (value[index] === '"' && value[index - 1] !== '\\') {
      return index;
    }
  }
  return -1;
}

function normalizeScalarToken(key: TypedSearchFilterKey, raw: string, value: string): ScalarResult {
  switch (key) {
    case 'from':
    case 'to': {
      const normalizedValue = expandDate(value, key);
      if (!normalizedValue) {
        return { issue: makeIssue('invalid-date', raw, `Invalid date for "${key}"`, key, value) };
      }
      return { token: { kind: 'scalar', key, raw, value, normalizedValue } };
    }
    case 'city':
    case 'country': {
      return { token: { kind: 'scalar', key, raw, value, normalizedValue: value } };
    }
    case 'type': {
      const normalizedValue = normalizeMediaType(value);
      if (!normalizedValue) {
        return { issue: makeIssue('invalid-type', raw, 'Type must be photo, image, or video', key, value) };
      }
      return { token: { kind: 'scalar', key, raw, value, normalizedValue } };
    }
    case 'favorite': {
      const normalizedValue = normalizeFavorite(value);
      if (normalizedValue === undefined) {
        return { issue: makeIssue('invalid-favorite', raw, 'Favorite must be true or false', key, value) };
      }
      return { token: { kind: 'scalar', key, raw, value, normalizedValue } };
    }
    case 'rating': {
      const normalizedValue = Number(value);
      if (!Number.isInteger(normalizedValue) || normalizedValue < 1 || normalizedValue > 5) {
        return { issue: makeIssue('invalid-rating', raw, 'Rating must be between 1 and 5', key, value) };
      }
      return { token: { kind: 'scalar', key, raw, value, normalizedValue } };
    }
    default: {
      return { issue: makeIssue('unknown-key', raw, `Unknown filter "${key}"`, key, value) };
    }
  }
}

function expandDate(value: string, boundary: 'from' | 'to'): string | undefined {
  const yearMatch = /^(\d{4})$/.exec(value);
  if (yearMatch) {
    return boundary === 'from' ? `${yearMatch[1]}-01-01` : `${yearMatch[1]}-12-31`;
  }

  const monthMatch = /^(\d{4})-(\d{2})$/.exec(value);
  if (monthMatch) {
    const [, year, month] = monthMatch;
    const monthNumber = Number(month);
    if (monthNumber < 1 || monthNumber > 12) {
      return undefined;
    }
    if (boundary === 'from') {
      return `${year}-${month}-01`;
    }
    return `${year}-${month}-${String(lastDayOfMonth(Number(year), monthNumber)).padStart(2, '0')}`;
  }

  const dayMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!dayMatch) {
    return undefined;
  }

  const [, year, month, day] = dayMatch;
  const yearNumber = Number(year);
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  if (monthNumber < 1 || monthNumber > 12 || dayNumber < 1 || dayNumber > lastDayOfMonth(yearNumber, monthNumber)) {
    return undefined;
  }

  return `${year}-${month}-${day}`;
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function normalizeMediaType(value: string): 'image' | 'video' | undefined {
  const normalized = value.toLowerCase();
  if (normalized === 'photo' || normalized === 'photos' || normalized === 'image' || normalized === 'images') {
    return 'image';
  }
  if (normalized === 'video' || normalized === 'videos') {
    return 'video';
  }
  return undefined;
}

function normalizeFavorite(value: string): boolean | undefined {
  switch (value.toLowerCase()) {
    case 'true':
    case 'yes':
    case '1': {
      return true;
    }
    case 'false':
    case 'no':
    case '0': {
      return false;
    }
    default: {
      return undefined;
    }
  }
}

function validateDateRange(tokens: TypedSearchScalarToken[]): TypedSearchIssue | undefined {
  const from = tokens.find((token) => token.key === 'from');
  const to = tokens.find((token) => token.key === 'to');
  if (!from || !to || String(from.normalizedValue) <= String(to.normalizedValue)) {
    return undefined;
  }

  return makeIssue('invalid-range', from.raw, 'Start date must be before end date', from.key, from.value);
}

function makeIssue(
  code: TypedSearchIssueCode,
  raw: string,
  message: string,
  key?: string,
  value?: string,
): TypedSearchIssue {
  return { code, key, raw, value, message };
}

function issueMessage(code: 'unterminated-quote' | 'escaped-quote', key: string): string {
  if (code === 'escaped-quote') {
    return 'Escaped quotes are not supported in filters';
  }
  return `Filter "${key}" has an unterminated quote`;
}
