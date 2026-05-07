import { formatPeopleHeaderDescription } from '$lib/utils/people-statistics';

describe(formatPeopleHeaderDescription.name, () => {
  it('formats visible people with plural detected faces', () => {
    expect(
      formatPeopleHeaderDescription({
        visiblePeopleCount: 60,
        detectedFaceCount: 2901,
        locale: 'en-US',
        faceSingular: 'face',
        facePlural: 'faces',
      }),
    ).toBe('(60) \u00B7 2,901 faces');
  });

  it('formats singular detected face labels', () => {
    expect(
      formatPeopleHeaderDescription({
        visiblePeopleCount: 1,
        detectedFaceCount: 1,
        locale: 'en-US',
        faceSingular: 'face',
        facePlural: 'faces',
      }),
    ).toBe('(1) \u00B7 1 face');
  });

  it('uses locale formatting for people and face counts', () => {
    expect(
      formatPeopleHeaderDescription({
        visiblePeopleCount: 1234,
        detectedFaceCount: 5678,
        locale: 'de-DE',
        faceSingular: 'face',
        facePlural: 'faces',
      }),
    ).toBe('(1.234) \u00B7 5.678 faces');
  });

  it('can return only the people count when the face count is unsupported for the current filter', () => {
    expect(
      formatPeopleHeaderDescription({
        visiblePeopleCount: 1,
        detectedFaceCount: 2901,
        locale: 'en-US',
        faceSingular: 'face',
        facePlural: 'faces',
        includeFaceCount: false,
      }),
    ).toBe('(1)');
  });

  it('returns the people count when no face statistics are available', () => {
    expect(
      formatPeopleHeaderDescription({
        visiblePeopleCount: 10,
        detectedFaceCount: null,
        locale: 'en-US',
        faceSingular: 'face',
        facePlural: 'faces',
      }),
    ).toBe('(10)');
  });

  it('omits zero people with zero detected faces by default', () => {
    expect(
      formatPeopleHeaderDescription({
        visiblePeopleCount: 0,
        detectedFaceCount: 0,
        locale: 'en-US',
        faceSingular: 'face',
        facePlural: 'faces',
      }),
    ).toBeUndefined();
  });

  it('shows zero visible people when detected faces exist', () => {
    expect(
      formatPeopleHeaderDescription({
        visiblePeopleCount: 0,
        detectedFaceCount: 42,
        locale: 'en-US',
        faceSingular: 'face',
        facePlural: 'faces',
        showZeroPeople: true,
      }),
    ).toBe('(0) \u00B7 42 faces');
  });

  it('does not render invalid face text for missing detected-face counts', () => {
    for (const detectedFaceCount of [null, undefined]) {
      const description = formatPeopleHeaderDescription({
        visiblePeopleCount: 3,
        detectedFaceCount,
        locale: 'en-US',
        faceSingular: 'face',
        facePlural: 'faces',
      });

      expect(description).toBe('(3)');
      expect(description).not.toContain('undefined faces');
      expect(description).not.toContain('NaN faces');
    }
  });
});
