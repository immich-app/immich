import { describe, expect, it } from 'vitest';
import { getActiveTypedSearchToken, parseTypedSearch, rewriteTypedSearchToken } from './typed-search-parser';

describe('parseTypedSearch', () => {
  it('extracts plain query text and recognized filters', () => {
    const result = parseTypedSearch('beach person:anna from:2025 to:2026 camera:nikon type:photo');

    expect(result.queryText).toBe('beach');
    expect(result.resolutionTokens).toMatchObject([
      { kind: 'resolution', key: 'person', raw: 'person:anna', value: 'anna' },
      { kind: 'resolution', key: 'camera', raw: 'camera:nikon', value: 'nikon' },
    ]);
    expect(result.scalarTokens).toMatchObject([
      { kind: 'scalar', key: 'from', raw: 'from:2025', value: '2025', normalizedValue: '2025-01-01' },
      { kind: 'scalar', key: 'to', raw: 'to:2026', value: '2026', normalizedValue: '2026-12-31' },
      { kind: 'scalar', key: 'type', raw: 'type:photo', value: 'photo', normalizedValue: 'image' },
    ]);
    expect(result.issues).toEqual([]);
  });

  it('supports quoted values with spaces', () => {
    const result = parseTypedSearch('beach person:"Anna Maria" city:"New York"');

    expect(result.queryText).toBe('beach');
    expect(result.resolutionTokens).toMatchObject([
      { kind: 'resolution', key: 'person', raw: 'person:"Anna Maria"', value: 'Anna Maria' },
    ]);
    expect(result.scalarTokens).toMatchObject([
      { kind: 'scalar', key: 'city', raw: 'city:"New York"', value: 'New York', normalizedValue: 'New York' },
    ]);
  });

  it('returns token spans for plain and quoted typed filters', () => {
    const result = parseTypedSearch('beach person:"Anna Maria" city:Paris');

    expect(result.tokens).toMatchObject([
      {
        raw: 'person:"Anna Maria"',
        key: 'person',
        value: 'Anna Maria',
        start: 6,
        end: 25,
        valueStart: 14,
        valueEnd: 24,
        quoted: true,
      },
      {
        raw: 'city:Paris',
        key: 'city',
        value: 'Paris',
        start: 26,
        end: 36,
        valueStart: 31,
        valueEnd: 36,
        quoted: false,
      },
    ]);
  });

  it('keeps empty known filters quiet in draft mode but blocking in commit mode', () => {
    const draft = parseTypedSearch('person: tag: country: city:', { mode: 'draft' });
    const commit = parseTypedSearch('person: tag: country: city:');

    expect(draft.issues).toEqual([]);
    expect(draft.tokens.map((token) => token.raw)).toEqual(['person:', 'tag:', 'country:', 'city:']);
    expect(commit.issues.map((issue) => issue.code)).toEqual([
      'empty-value',
      'empty-value',
      'empty-value',
      'empty-value',
    ]);
  });

  it('keeps unterminated quoted filters as draft issues', () => {
    const result = parseTypedSearch('person:"Anna Maria', { mode: 'draft' });

    expect(result.issues).toEqual([expect.objectContaining({ code: 'unterminated-quote', raw: 'person:"Anna Maria' })]);
  });

  it('accepts plural people and tags aliases', () => {
    const result = parseTypedSearch('people:anna tags:nature beach');

    expect(result.queryText).toBe('beach');
    expect(result.resolutionTokens).toMatchObject([
      { kind: 'resolution', key: 'person', raw: 'people:anna', value: 'anna' },
      { kind: 'resolution', key: 'tag', raw: 'tags:nature', value: 'nature' },
    ]);
    expect(result.displayTokens).toMatchObject([
      { raw: 'people:anna', key: 'person', value: 'anna', status: 'pending-entity' },
      { raw: 'tags:nature', key: 'tag', value: 'nature', status: 'pending-entity' },
    ]);
    expect(result.issues).toEqual([]);
  });

  it('rejects unknown alphabetic key value tokens', () => {
    const result = parseTypedSearch('beach persn:anna');

    expect(result.queryText).toBe('beach');
    expect(result.issues).toEqual([
      {
        code: 'unknown-key',
        key: 'persn',
        raw: 'persn:anna',
        value: 'anna',
        message: 'Unknown filter "persn"',
      },
    ]);
  });

  it('keeps non-filter colon text in the query', () => {
    const result = parseTypedSearch('IMG_1234.jpg ratio:3:2 http://example.test');

    expect(result.queryText).toBe('IMG_1234.jpg http://example.test');
    expect(result.issues).toEqual([
      {
        code: 'unknown-key',
        key: 'ratio',
        raw: 'ratio:3:2',
        value: '3:2',
        message: 'Unknown filter "ratio"',
      },
    ]);
  });

  it('rejects invalid scalar values', () => {
    const result = parseTypedSearch('from:soon to:2026-99-01 rating:9 type:gif favorite:maybe');

    expect(result.issues.map((issue) => issue.code)).toEqual([
      'invalid-date',
      'invalid-date',
      'invalid-rating',
      'invalid-type',
      'invalid-favorite',
    ]);
  });

  it('keeps invalid scalar tokens red in draft mode without suppressing their token issue', () => {
    const result = parseTypedSearch('rating:9 favorite:maybe', { mode: 'draft' });

    expect(result.issues.map((issue) => issue.code)).toEqual(['invalid-rating', 'invalid-favorite']);
    expect(result.displayTokens).toEqual([
      expect.objectContaining({ raw: 'rating:9', status: 'error' }),
      expect.objectContaining({ raw: 'favorite:maybe', status: 'error' }),
    ]);
  });

  it('rejects empty values and unterminated quotes on commit parse', () => {
    const result = parseTypedSearch('person: city:"New York');

    expect(result.issues.map((issue) => issue.code)).toEqual(['empty-value', 'unterminated-quote']);
  });

  it('rejects escaped quote sequences in quoted values', () => {
    const raw = String.raw`person:"Anna \"The Ace\""`;
    const value = String.raw`Anna \"The Ace\"`;
    const result = parseTypedSearch(raw);

    expect(result.issues).toEqual([
      {
        code: 'escaped-quote',
        key: 'person',
        raw,
        value,
        message: 'Escaped quotes are not supported in filters',
      },
    ]);
  });

  it('rejects duplicate scalar filters but allows repeated people and tags', () => {
    const result = parseTypedSearch('person:anna person:bob tag:travel tag:family city:Berlin city:Paris');

    expect(result.resolutionTokens.map((token) => token.raw)).toEqual([
      'person:anna',
      'person:bob',
      'tag:travel',
      'tag:family',
    ]);
    expect(result.issues).toEqual([
      {
        code: 'duplicate-filter',
        key: 'city',
        raw: 'city:Paris',
        value: 'Paris',
        message: 'Filter "city" can only be used once',
      },
    ]);
  });

  it('exposes span identity for repeated selected resolution tokens', () => {
    const result = parseTypedSearch('person:ann person:ann', { mode: 'draft' });

    expect(result.resolutionTokens.map((token) => token.identity)).toEqual([
      'person:0:10:person:ann',
      'person:11:21:person:ann',
    ]);
    expect(result.resolutionTokens).toMatchObject([
      { start: 0, end: 10, raw: 'person:ann' },
      { start: 11, end: 21, raw: 'person:ann' },
    ]);
  });

  it('assigns span identities to scalar tokens too', () => {
    const result = parseTypedSearch('country:Germany city:Berlin', { mode: 'draft' });

    expect(result.scalarTokens.map((token) => token.identity)).toEqual([
      'country:0:15:country:Germany',
      'city:16:27:city:Berlin',
    ]);
    expect(result.scalarTokens.map((token) => ({ start: token.start, end: token.end }))).toEqual([
      { start: 0, end: 15 },
      { start: 16, end: 27 },
    ]);
  });

  it('rejects a date range where from is after to', () => {
    const result = parseTypedSearch('from:2026 to:2025');

    expect(result.issues).toEqual([
      {
        code: 'invalid-range',
        key: 'from',
        raw: 'from:2026',
        value: '2026',
        message: 'Start date must be before end date',
      },
    ]);
  });

  it('normalizes keys and boolean or media values case-insensitively', () => {
    const result = parseTypedSearch('TYPE:Photo FAVORITE:Yes rating:4');

    expect(result.scalarTokens).toMatchObject([
      { key: 'type', normalizedValue: 'image' },
      { key: 'favorite', normalizedValue: true },
      { key: 'rating', normalizedValue: 4 },
    ]);
    expect(result.issues).toEqual([]);
  });

  it('finds the cursor active typed filter token', () => {
    const result = parseTypedSearch('beach person:ann tag:family', { mode: 'draft' });

    expect(getActiveTypedSearchToken(result, 12)).toMatchObject({ raw: 'person:ann', key: 'person' });
    expect(getActiveTypedSearchToken(result, 22)).toMatchObject({ raw: 'tag:family', key: 'tag' });
    expect(getActiveTypedSearchToken(result, 3)).toBeUndefined();
  });

  it('rewrites only the active token and quotes whitespace values', () => {
    const parsed = parseTypedSearch('beach person:ann tag:family', { mode: 'draft' });
    const token = getActiveTypedSearchToken(parsed, 12);

    expect(token).toBeDefined();
    expect(rewriteTypedSearchToken(parsed.raw, token!, { key: 'person', value: 'Anna Maria' })).toEqual({
      text: 'beach person:"Anna Maria" tag:family',
      caret: 'beach person:"Anna Maria"'.length,
    });
  });

  it('normalizes unsupported aliases when rewriting', () => {
    const parsed = parseTypedSearch('beach people:ann', { mode: 'draft' });
    const token = getActiveTypedSearchToken(parsed, 12);

    expect(rewriteTypedSearchToken(parsed.raw, token!, { key: 'person', value: 'Anna' }).text).toBe(
      'beach people:Anna',
    );
  });
});
