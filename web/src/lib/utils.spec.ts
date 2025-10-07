import { getReleaseType } from '$lib/utils';

describe('utils', () => {
  describe(getReleaseType.name, () => {
    it('should return "major" for major version changes', () => {
      expect(getReleaseType({ major: 1, minor: 0, patch: 0 }, { major: 2, minor: 0, patch: 0 })).toBe('major');
      expect(getReleaseType({ major: 1, minor: 0, patch: 0 }, { major: 3, minor: 2, patch: 1 })).toBe('major');
    });

    it('should return "minor" for minor version changes', () => {
      expect(getReleaseType({ major: 1, minor: 0, patch: 0 }, { major: 1, minor: 1, patch: 0 })).toBe('minor');
      expect(getReleaseType({ major: 1, minor: 0, patch: 0 }, { major: 1, minor: 2, patch: 1 })).toBe('minor');
    });

    it('should return "patch" for patch version changes', () => {
      expect(getReleaseType({ major: 1, minor: 0, patch: 0 }, { major: 1, minor: 0, patch: 1 })).toBe('patch');
      expect(getReleaseType({ major: 1, minor: 0, patch: 0 }, { major: 1, minor: 0, patch: 5 })).toBe('patch');
    });

    it('should return "none" for matching versions', () => {
      expect(getReleaseType({ major: 1, minor: 0, patch: 0 }, { major: 1, minor: 0, patch: 0 })).toBe('none');
      expect(getReleaseType({ major: 1, minor: 2, patch: 3 }, { major: 1, minor: 2, patch: 3 })).toBe('none');
    });
  });
});
