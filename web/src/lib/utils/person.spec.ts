import type { PersonResponseDto } from '@immich/sdk';
import { searchNameLocal } from './person';

const makePerson = (overrides: Partial<PersonResponseDto> = {}): PersonResponseDto => ({
  id: 'person-1',
  name: 'Amélie',
  thumbnailPath: '',
  isHidden: false,
  birthDate: null,
  ...overrides,
});

describe('searchNameLocal with single-word names', () => {
  it('should find a person by exact name match', () => {
    const people = [makePerson({ id: '1', name: 'Amélie' })];
    expect(searchNameLocal('Amélie', people, 10)).toEqual([people[0]]);
  });

  it('should find a person with accent-insensitive search', () => {
    const people = [makePerson({ id: '1', name: 'Amélie' })];
    expect(searchNameLocal('amelie', people, 10)).toEqual([people[0]]);
  });

  it('should find a person by prefix match', () => {
    const people = [makePerson({ id: '1', name: 'Amélie' })];
    expect(searchNameLocal('ame', people, 10)).toEqual([people[0]]);
  });

  it('should not match partial name where prefix does not match', () => {
    const people = [makePerson({ id: '1', name: 'Amélie' })];
    expect(searchNameLocal('lie', people, 10)).toEqual([]);
  });

  it('should be case insensitive', () => {
    const people = [makePerson({ id: '1', name: 'AMÉLIE' })];
    expect(searchNameLocal('amelie', people, 10)).toEqual([people[0]]);
  });

  it('should handle Hungarian accented characters', () => {
    const people = [makePerson({ id: '1', name: 'Árvíztűrő' })];
    expect(searchNameLocal('arvizturo', people, 10)).toEqual([people[0]]);
  });

  it('should handle Polish accented characters', () => {
    const people = [makePerson({ id: '1', name: 'Jędrzej' })];
    expect(searchNameLocal('jedrzej', people, 10)).toEqual([people[0]]);
  });

  it('should handle no matches', () => {
    const people = [makePerson({ id: '1', name: 'Amélie' })];
    expect(searchNameLocal('xyz', people, 10)).toEqual([]);
  });

  it('should respect the slice parameter', () => {
    const people = [
      makePerson({ id: '1', name: 'Amélie' }),
      makePerson({ id: '2', name: 'Amadeus' }),
      makePerson({ id: '3', name: 'Aminta' }),
    ];
    expect(searchNameLocal('am', people, 2)).toHaveLength(2);
  });
});

describe('searchNameLocal with multi-word names', () => {
  it('should find a person matching the first name', () => {
    const people = [makePerson({ id: '1', name: 'Jean Amélie' })];
    expect(searchNameLocal('jean', people, 10)).toEqual([people[0]]);
  });

  it('should find a person matching the last name with accent insensitivity', () => {
    const people = [makePerson({ id: '1', name: 'Amélie Dupont' })];
    expect(searchNameLocal('dupont', people, 10)).toEqual([people[0]]);
  });

  it('should find a person matching any space-separated word', () => {
    const people = [makePerson({ id: '1', name: 'Jean Amélie Dupont' })];
    expect(searchNameLocal('dupont', people, 10)).toEqual([people[0]]);
    expect(searchNameLocal('jean', people, 10)).toEqual([people[0]]);
  });

  it('should match prefix of any word in a multi-word name', () => {
    const people = [makePerson({ id: '1', name: 'Maria João Silva' })];
    expect(searchNameLocal('joão', people, 10)).toEqual([people[0]]);
    expect(searchNameLocal('joao', people, 10)).toEqual([people[0]]);
    expect(searchNameLocal('sil', people, 10)).toEqual([people[0]]);
  });

  it('should match when search term is a multi-word prefix of the full name', () => {
    const people = [makePerson({ id: '1', name: 'Jean Amélie Dupont' })];
    expect(searchNameLocal('jean amélie', people, 10)).toEqual([people[0]]);
  });

  it('should not match when search term does not prefix the full name', () => {
    const people = [makePerson({ id: '1', name: 'Jean Amélie' })];
    expect(searchNameLocal('jean x', people, 10)).toEqual([]);
  });
});

describe('searchNameLocal with personId exclusion', () => {
  it('should exclude the person with the given id', () => {
    const people = [makePerson({ id: '1', name: 'Amélie' }), makePerson({ id: '2', name: 'Amélie' })];
    const result = searchNameLocal('amélie', people, 10, '1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('should return empty when only the excluded person matches', () => {
    const people = [makePerson({ id: '1', name: 'Amélie' })];
    expect(searchNameLocal('amélie', people, 10, '1')).toEqual([]);
  });

  it('should still exclude when search is accent-insensitive', () => {
    const people = [makePerson({ id: '1', name: 'Amélie' }), makePerson({ id: '2', name: 'Amélie' })];
    const result = searchNameLocal('amelie', people, 10, '1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });
});
