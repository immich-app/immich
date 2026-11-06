import { maintenanceReturnUrl } from '#lib/utils/maintenance.ts';

describe('maintenance', () => {
  describe(maintenanceReturnUrl.name, () => {
    it('should resolve a same-origin continue url', () => {
      expect(maintenanceReturnUrl(new URLSearchParams({ continue: '/photos' }))).property(
        'href',
        `${location.origin}/photos`,
      );
    });

    it('should fall back to the root route when continue is missing', () => {
      expect(maintenanceReturnUrl(new URLSearchParams())).property('href', `${location.origin}/`);
    });

    it('should reject a cross-origin continue url', () => {
      expect(maintenanceReturnUrl(new URLSearchParams({ continue: 'https://malicious.site/evil' }))).toBe('/');
    });
  });
});
