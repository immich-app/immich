import { maintenanceReturnUrl } from '$lib/utils/maintenance';

describe('maintenance', () => {
  describe(maintenanceReturnUrl.name, () => {
    beforeEach(() => {
      // @ts-expect-error - override location for testing
      // eslint-disable-next-line unicorn/no-global-object-property-assignment
      globalThis.location = new URL('https://my.immich.server');
      vi.spyOn(document, 'baseURI', 'get').mockReturnValue('https://my.immich.server/');
    });

    it('should resolve a same-origin continue url', () => {
      expect(maintenanceReturnUrl(new URLSearchParams({ continue: '/photos' }))).property(
        'href',
        'https://my.immich.server/photos',
      );
    });

    it('should fall back to the root route when continue is missing', () => {
      expect(maintenanceReturnUrl(new URLSearchParams())).property('href', 'https://my.immich.server/');
    });

    it('should reject a cross-origin continue url', () => {
      expect(maintenanceReturnUrl(new URLSearchParams({ continue: 'https://malicious.site/evil' }))).toBe('/');
    });
  });
});
