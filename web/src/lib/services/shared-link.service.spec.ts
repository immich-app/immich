import { asUrl } from '#lib/services/shared-link.service.ts';
import { sharedLinkFactory } from '#test-data/factories/shared-link-factory';

vi.mock(import('#lib/queries/client.js'), async (importOriginal) => ({
  ...(await importOriginal()),
  readPreloadedQuery: vi.fn().mockReturnValue({ server: { externalDomain: 'http://localhost:2283' } }),
}));

describe('SharedLinkService', () => {
  describe('asUrl', () => {
    it('should properly encode characters in slug', () => {
      expect(asUrl(sharedLinkFactory.build({ slug: 'foo/bar' }))).toBe('http://localhost:2283/s/foo%2Fbar');
    });
  });
});
