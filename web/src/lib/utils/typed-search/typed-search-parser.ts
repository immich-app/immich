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
  start: number;
  end: number;
  identity: TypedSearchTokenIdentity;
};

export type TypedSearchResolutionToken = {
  kind: 'resolution';
  key: TypedSearchResolutionKey;
  raw: string;
  value: string;
  start: number;
  end: number;
  identity: TypedSearchTokenIdentity;
};

export type TypedSearchDisplayToken = {
  raw: string;
  key: string;
  value: string;
  status: 'recognized' | 'pending-entity' | 'resolved-entity' | 'error';
  issue?: TypedSearchIssue;
};

export type TypedSearchParseMode = 'commit' | 'draft';
export type TypedSearchTokenIdentity = `${TypedSearchFilterKey}:${number}:${number}:${string}`;

export type TypedSearchTokenSpan = {
  raw: string;
  key?: TypedSearchFilterKey;
  rawKey?: string;
  value: string;
  start: number;
  end: number;
  valueStart: number;
  valueEnd: number;
  quoted: boolean;
  issue?: TypedSearchIssue;
};

export type TypedSearchParseOptions = {
  mode?: TypedSearchParseMode;
};

export type TypedSearchParseResult = {
  raw: string;
  queryText: string;
  scalarTokens: TypedSearchScalarToken[];
  resolutionTokens: TypedSearchResolutionToken[];
  displayTokens: TypedSearchDisplayToken[];
  issues: TypedSearchIssue[];
  tokens: TypedSearchTokenSpan[];
};

export type TypedSearchRewriteValue = {
  key: TypedSearchFilterKey;
  value: string;
};

type ParsedPiece = {
  raw: string;
  start: number;
  end: number;
  key?: string;
  value: string;
  valueStart: number;
  valueEnd: number;
  quoted: boolean;
  issue?: 'unterminated-quote' | 'escaped-quote';
};

type TypedSearchScalarTokenBase = Omit<TypedSearchScalarToken, 'start' | 'end' | 'identity'>;

type ScalarResult =
  | { token: TypedSearchScalarTokenBase }
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

type TypedSearchTokenIdentityParts = {
  key: TypedSearchFilterKey;
  start: number;
  end: number;
  raw: string;
};

export function getTypedSearchTokenIdentity(token: TypedSearchTokenIdentityParts): TypedSearchTokenIdentity;
export function getTypedSearchTokenIdentity(
  key: TypedSearchFilterKey,
  start: number,
  end: number,
  raw: string,
): TypedSearchTokenIdentity;
export function getTypedSearchTokenIdentity(
  ...args: [TypedSearchTokenIdentityParts] | [TypedSearchFilterKey, number, number, string]
): TypedSearchTokenIdentity {
  if (args.length === 1) {
    const [token] = args;
    return `${token.key}:${token.start}:${token.end}:${token.raw}`;
  }
  const [key, start, end, raw] = args;
  return `${key}:${start}:${end}:${raw}`;
}

export function parseTypedSearch(raw: string, options: TypedSearchParseOptions = {}): TypedSearchParseResult {
  const mode = options.mode ?? 'commit';
  const pieces = splitSearch(raw);
  const queryParts: string[] = [];
  const scalarTokens: TypedSearchScalarToken[] = [];
  const resolutionTokens: TypedSearchResolutionToken[] = [];
  const displayTokens: TypedSearchDisplayToken[] = [];
  const issues: TypedSearchIssue[] = [];
  const tokens: TypedSearchTokenSpan[] = [];
  const seenScalarKeys = new Set<string>();

  for (const piece of pieces) {
    if (!piece.key) {
      queryParts.push(piece.raw);
      continue;
    }

    const key = normalizeFilterKey(piece.key);
    const token: TypedSearchTokenSpan = {
      raw: piece.raw,
      key,
      rawKey: piece.key,
      value: piece.value,
      start: piece.start,
      end: piece.end,
      valueStart: piece.valueStart,
      valueEnd: piece.valueEnd,
      quoted: piece.quoted,
    };
    tokens.push(token);

    if (!key) {
      const issue = makeIssue('unknown-key', piece.raw, `Unknown filter "${piece.key}"`, piece.key, piece.value);
      token.issue = issue;
      issues.push(issue);
      displayTokens.push({ raw: piece.raw, key: piece.key, value: piece.value, status: 'error', issue });
      continue;
    }

    if (piece.issue) {
      const issue = makeIssue(piece.issue, piece.raw, issueMessage(piece.issue, key), key, piece.value);
      token.issue = issue;
      issues.push(issue);
      displayTokens.push({ raw: piece.raw, key, value: piece.value, status: 'error', issue });
      continue;
    }

    if (!piece.value.trim()) {
      if (mode === 'draft') {
        displayTokens.push({
          raw: piece.raw,
          key,
          value: piece.value,
          status: RESOLUTION_KEYS.has(key as TypedSearchResolutionKey) ? 'pending-entity' : 'recognized',
        });
        continue;
      }
      const issue = makeIssue('empty-value', piece.raw, `Filter "${key}" needs a value`, key, piece.value);
      token.issue = issue;
      issues.push(issue);
      displayTokens.push({ raw: piece.raw, key, value: piece.value, status: 'error', issue });
      continue;
    }

    if (!REPEATABLE_KEYS.has(key) && seenScalarKeys.has(key)) {
      const issue = makeIssue('duplicate-filter', piece.raw, `Filter "${key}" can only be used once`, key, piece.value);
      token.issue = issue;
      issues.push(issue);
      displayTokens.push({ raw: piece.raw, key, value: piece.value, status: 'error', issue });
      continue;
    }

    if (RESOLUTION_KEYS.has(key as TypedSearchResolutionKey)) {
      const resolutionKey = key as TypedSearchResolutionKey;
      resolutionTokens.push({
        kind: 'resolution',
        key: resolutionKey,
        raw: piece.raw,
        value: piece.value,
        start: piece.start,
        end: piece.end,
        identity: getTypedSearchTokenIdentity({
          key: resolutionKey,
          start: piece.start,
          end: piece.end,
          raw: piece.raw,
        }),
      });
      displayTokens.push({ raw: piece.raw, key, value: piece.value, status: 'pending-entity' });
      continue;
    }

    seenScalarKeys.add(key);
    const scalar = normalizeScalarToken(key, piece.raw, piece.value);
    if ('issue' in scalar) {
      token.issue = scalar.issue;
      issues.push(scalar.issue);
      displayTokens.push({ raw: piece.raw, key, value: piece.value, status: 'error', issue: scalar.issue });
      continue;
    }

    scalarTokens.push({
      ...scalar.token,
      start: piece.start,
      end: piece.end,
      identity: getTypedSearchTokenIdentity({
        key: scalar.token.key,
        start: piece.start,
        end: piece.end,
        raw: piece.raw,
      }),
    });
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
    tokens,
  };
}

export function getActiveTypedSearchToken(
  parsed: TypedSearchParseResult,
  caret: number | null | undefined,
): TypedSearchTokenSpan | undefined {
  if (caret === null || caret === undefined) {
    return undefined;
  }
  return parsed.tokens.find((token) => caret >= token.start && caret <= token.end);
}

export function rewriteTypedSearchToken(
  raw: string,
  token: TypedSearchTokenSpan,
  next: TypedSearchRewriteValue,
): { text: string; caret: number } {
  const key = token.rawKey && normalizeFilterKey(token.rawKey) === next.key ? token.rawKey : next.key;
  const value = quoteTypedSearchValue(next.value);
  const replacement = `${key}:${value}`;
  const text = `${raw.slice(0, token.start)}${replacement}${raw.slice(token.end)}`;
  return { text, caret: token.start + replacement.length };
}

function quoteTypedSearchValue(value: string): string {
  return /\s/.test(value) ? `"${value}"` : value;
}

function normalizeFilterKey(rawKey: string): TypedSearchFilterKey | undefined {
  const lowerKey = rawKey.toLowerCase();
  const aliasedKey = FILTER_KEY_ALIASES[lowerKey] ?? lowerKey;
  return FILTER_KEYS.has(aliasedKey as TypedSearchFilterKey) ? (aliasedKey as TypedSearchFilterKey) : undefined;
}

function splitSearch(raw: string): ParsedPiece[] {
  const parts: ParsedPiece[] = [];
  let current = '';
  let currentStart = 0;
  let inQuote = false;

  for (let index = 0; index < raw.length; index++) {
    const char = raw[index];
    if (char === '"' && raw[index - 1] !== '\\') {
      inQuote = !inQuote;
    }

    if (/\s/.test(char) && !inQuote) {
      if (current) {
        parts.push(parsePiece(current, currentStart, index));
        current = '';
      }
      continue;
    }

    if (!current) {
      currentStart = index;
    }
    current += char;
  }

  if (current) {
    parts.push(parsePiece(current, currentStart, raw.length));
  }

  return parts;
}

function parsePiece(raw: string, start: number, end: number): ParsedPiece {
  if (raw.includes('://')) {
    return { raw, start, end, value: '', valueStart: start, valueEnd: end, quoted: false };
  }

  const match = /^([A-Za-z]+):(.*)$/s.exec(raw);
  if (!match) {
    return { raw, start, end, value: '', valueStart: start, valueEnd: end, quoted: false };
  }

  const [, key, rawValue] = match;
  const valueOffset = key.length + 1;
  if (!rawValue.startsWith('"')) {
    return {
      raw,
      start,
      end,
      key,
      value: rawValue,
      valueStart: start + valueOffset,
      valueEnd: end,
      quoted: false,
    };
  }

  const closingQuoteIndex = findClosingQuote(rawValue);
  const value = closingQuoteIndex === -1 ? rawValue.slice(1) : rawValue.slice(1, closingQuoteIndex);
  const valueStart = start + valueOffset + 1;
  const valueEnd = closingQuoteIndex === -1 ? end : start + valueOffset + closingQuoteIndex;
  if (value.includes(String.raw`\"`)) {
    return {
      raw,
      start,
      end,
      key,
      value,
      valueStart,
      valueEnd,
      quoted: true,
      issue: 'escaped-quote',
    };
  }
  if (closingQuoteIndex === -1) {
    return {
      raw,
      start,
      end,
      key,
      value,
      valueStart,
      valueEnd,
      quoted: true,
      issue: 'unterminated-quote',
    };
  }

  return { raw, start, end, key, value, valueStart, valueEnd, quoted: true };
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
