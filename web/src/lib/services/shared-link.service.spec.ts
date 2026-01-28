import { asUrl } from '$lib/services/shared-link.service';
import type { ServerConfigDto } from '@immich/sdk';
import { sharedLinkFactory } from '@test-data/factories/shared-link-factory';

describe('SharedLinkService', () => {
  beforeAll(() => {
    vi.mock(import('$lib/managers/server-config-manager.svelte'), () => ({
      serverConfigManager: {
        value: { externalDomain: 'http://localhost:2283' } as ServerConfigDto,
        init: vi.fn(),
        loadServerConfig: vi.fn(),
      },
    }));
  });

  describe('asUrl', () => {
    it('should properly encode characters in slug', () => {
      expect(asUrl(sharedLinkFactory.build({ slug: 'foo/bar' }))).toBe('http://localhost:2283/s/foo%2Fbar');
    });
  });
});
