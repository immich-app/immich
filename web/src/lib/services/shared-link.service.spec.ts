import { asUrl } from '#lib/services/shared-link.service.ts';
import { factory } from '#test/unit/factories.ts';

vi.mock(import('#lib/queries/client.js'), async (importOriginal) => ({
  ...(await importOriginal()),
  readPreloadedQuery: vi.fn().mockReturnValue({ server: { externalDomain: 'http://localhost:2283' } }),
}));

describe('SharedLinkService', () => {
  describe('asUrl', () => {
    it('should properly encode characters in slug', () => {
      expect(asUrl(factory.sharedLink({ slug: 'foo/bar' }))).toBe('http://localhost:2283/s/foo%2Fbar');
    });
  });
});
