import { buildMapFilterConfig } from '$lib/utils/map-filter-config';
import { getAllPeople, getSpacePeople } from '@immich/sdk';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@immich/sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@immich/sdk')>();
  return {
    ...actual,
    getAllPeople: vi.fn(),
    getSpacePeople: vi.fn(),
    getAllTags: vi.fn().mockResolvedValue([]),
    getSearchSuggestions: vi.fn().mockResolvedValue([]),
  };
});

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

  describe('people provider', () => {
    it('should exclude unnamed people in non-space config', async () => {
      vi.mocked(getAllPeople).mockResolvedValue({
        total: 3,
        visible: 3,
        people: [
          { id: '1', name: 'Alice', thumbnailPath: '/thumb/1' },
          { id: '2', name: '', thumbnailPath: '/thumb/2' },
          { id: '3', name: 'Bob', thumbnailPath: '/thumb/3' },
        ],
      } as never);

      const config = buildMapFilterConfig();
      const people = await config.providers.people!();

      expect(people).toHaveLength(2);
      expect(people.map((p) => p.name)).toEqual(['Alice', 'Bob']);
    });

    it('should map thumbnailUrl correctly in non-space config', async () => {
      vi.mocked(getAllPeople).mockResolvedValue({
        total: 1,
        visible: 1,
        people: [{ id: '1', name: 'Alice', thumbnailPath: '/thumb/1' }],
      } as never);

      const config = buildMapFilterConfig();
      const people = await config.providers.people!();

      expect(people[0].thumbnailUrl).toContain('/people/1/thumbnail');
    });

    it('should exclude unnamed people in space config', async () => {
      vi.mocked(getSpacePeople).mockResolvedValue([
        { id: '1', name: 'Alice', thumbnailPath: '/thumb/1' },
        { id: '2', name: '', thumbnailPath: '/thumb/2' },
        { id: '3', name: 'Bob', thumbnailPath: '/thumb/3' },
      ] as never);

      const config = buildMapFilterConfig('space-123');
      const people = await config.providers.people!();

      expect(people).toHaveLength(2);
      expect(people.map((p) => p.name)).toEqual(['Alice', 'Bob']);
    });

    it('should exclude hidden people in space config', async () => {
      vi.mocked(getSpacePeople).mockResolvedValue([
        { id: '1', name: 'Alice', isHidden: false },
        { id: '2', name: 'Bob', isHidden: true },
      ] as never);

      const config = buildMapFilterConfig('space-123');
      const people = await config.providers.people!();

      expect(people).toHaveLength(1);
      expect(people[0].name).toBe('Alice');
    });

    it('should map thumbnailUrl correctly in space config', async () => {
      vi.mocked(getSpacePeople).mockResolvedValue([
        { id: '1', name: 'Alice', thumbnailPath: '/thumb/1', updatedAt: '2025-01-01' },
      ] as never);

      const config = buildMapFilterConfig('space-123');
      const people = await config.providers.people!();

      expect(people[0].thumbnailUrl).toContain('/shared-spaces/space-123/people/1/thumbnail');
    });
  });
});
