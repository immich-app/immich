import { buildMapFilterConfig } from '$lib/utils/map-filter-config';
import { describe, expect, it } from 'vitest';

describe('buildMapFilterConfig', () => {
  it('should return config without location section', () => {
    const config = buildMapFilterConfig();
    expect(config.sections).not.toContain('location');
  });

  it('should include expected sections', () => {
    const config = buildMapFilterConfig();
    expect(config.sections).toContain('timeline');
    expect(config.sections).toContain('people');
    expect(config.sections).toContain('camera');
    expect(config.sections).toContain('tags');
    expect(config.sections).toContain('rating');
    expect(config.sections).toContain('media');
    expect(config.sections).toContain('favorites');
  });

  it('should provide all required providers', () => {
    const config = buildMapFilterConfig();
    expect(config.providers.people).toBeDefined();
    expect(config.providers.cameras).toBeDefined();
    expect(config.providers.cameraModels).toBeDefined();
    expect(config.providers.tags).toBeDefined();
  });

  it('should provide space-scoped providers when spaceId given', () => {
    const config = buildMapFilterConfig('space-123');
    expect(config.providers.people).toBeDefined();
    expect(config.sections).not.toContain('location');
  });
});
