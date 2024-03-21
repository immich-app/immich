import { Version, VersionType } from 'src/utils/version';

describe('Version', () => {
  const tests = [
    { this: new Version(0, 0, 1), other: new Version(0, 0, 0), compare: 1, type: VersionType.PATCH },
    { this: new Version(0, 1, 0), other: new Version(0, 0, 0), compare: 1, type: VersionType.MINOR },
    { this: new Version(1, 0, 0), other: new Version(0, 0, 0), compare: 1, type: VersionType.MAJOR },
    { this: new Version(0, 0, 0), other: new Version(0, 0, 1), compare: -1, type: VersionType.PATCH },
    { this: new Version(0, 0, 0), other: new Version(0, 1, 0), compare: -1, type: VersionType.MINOR },
    { this: new Version(0, 0, 0), other: new Version(1, 0, 0), compare: -1, type: VersionType.MAJOR },
    { this: new Version(0, 0, 0), other: new Version(0, 0, 0), compare: 0, type: VersionType.EQUAL },
    { this: new Version(0, 0, 1), other: new Version(0, 0, 1), compare: 0, type: VersionType.EQUAL },
    { this: new Version(0, 1, 0), other: new Version(0, 1, 0), compare: 0, type: VersionType.EQUAL },
    { this: new Version(1, 0, 0), other: new Version(1, 0, 0), compare: 0, type: VersionType.EQUAL },
    { this: new Version(1, 0), other: new Version(1, 0, 0), compare: 0, type: VersionType.EQUAL },
    { this: new Version(1, 0), other: new Version(1, 0, 1), compare: -1, type: VersionType.PATCH },
    { this: new Version(1, 1), other: new Version(1, 0, 1), compare: 1, type: VersionType.MINOR },
    { this: new Version(1), other: new Version(1, 0, 0), compare: 0, type: VersionType.EQUAL },
    { this: new Version(1), other: new Version(1, 0, 1), compare: -1, type: VersionType.PATCH },
  ];

  describe('isOlderThan', () => {
    for (const { this: thisVersion, other: otherVersion, compare, type } of tests) {
      const expected = compare < 0 ? type : VersionType.EQUAL;
      it(`should return '${expected}' when comparing ${thisVersion} to ${otherVersion}`, () => {
        expect(thisVersion.isOlderThan(otherVersion)).toEqual(expected);
      });
    }
  });

  describe('isEqual', () => {
    for (const { this: thisVersion, other: otherVersion, compare } of tests) {
      const bool = compare === 0;
      it(`should return ${bool} when comparing ${thisVersion} to ${otherVersion}`, () => {
        expect(thisVersion.isEqual(otherVersion)).toEqual(bool);
      });
    }
  });

  describe('isNewerThan', () => {
    for (const { this: thisVersion, other: otherVersion, compare, type } of tests) {
      const expected = compare > 0 ? type : VersionType.EQUAL;
      it(`should return ${expected} when comparing ${thisVersion} to ${otherVersion}`, () => {
        expect(thisVersion.isNewerThan(otherVersion)).toEqual(expected);
      });
    }
  });

  describe('fromString', () => {
    const tests = [
      { scenario: 'leading v', value: 'v1.72.2', expected: new Version(1, 72, 2) },
      { scenario: 'uppercase v', value: 'V1.72.2', expected: new Version(1, 72, 2) },
      { scenario: 'missing v', value: '1.72.2', expected: new Version(1, 72, 2) },
      { scenario: 'large patch', value: '1.72.123', expected: new Version(1, 72, 123) },
      { scenario: 'large minor', value: '1.123.0', expected: new Version(1, 123, 0) },
      { scenario: 'large major', value: '123.0.0', expected: new Version(123, 0, 0) },
      { scenario: 'major bump', value: 'v2.0.0', expected: new Version(2, 0, 0) },
      { scenario: 'has dash', value: '14.10-1', expected: new Version(14, 10, 1) },
      { scenario: 'missing patch', value: '14.10', expected: new Version(14, 10, 0) },
      { scenario: 'only major', value: '14', expected: new Version(14, 0, 0) },
    ];

    for (const { scenario, value, expected } of tests) {
      it(`should correctly parse ${scenario}`, () => {
        const actual = Version.fromString(value);
        expect(actual.major).toEqual(expected.major);
        expect(actual.minor).toEqual(expected.minor);
        expect(actual.patch).toEqual(expected.patch);
      });
    }
  });
});
