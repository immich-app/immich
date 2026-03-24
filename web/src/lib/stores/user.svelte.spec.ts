import { eventManager } from '$lib/managers/event-manager.svelte';
import { recentSpacesDropdown } from '$lib/stores/preferences.store';
import { userInteraction } from '$lib/stores/user.svelte';
import { sharedSpaceFactory } from '@test-data/factories/shared-space-factory';
import { get } from 'svelte/store';

describe('userInteraction.recentSpaces', () => {
  beforeEach(() => {
    userInteraction.recentSpaces = undefined;
  });

  it('defaults to undefined', () => {
    expect(userInteraction.recentSpaces).toBeUndefined();
  });

  it('resets to undefined on SpaceAddAssets event', () => {
    userInteraction.recentSpaces = [sharedSpaceFactory.build()];
    expect(userInteraction.recentSpaces).toBeDefined();

    eventManager.emit('SpaceAddAssets', { assetIds: ['a1'], spaceId: 's1' });
    expect(userInteraction.recentSpaces).toBeUndefined();
  });

  it('resets to undefined on SpaceRemoveAssets event', () => {
    userInteraction.recentSpaces = [sharedSpaceFactory.build()];
    expect(userInteraction.recentSpaces).toBeDefined();

    eventManager.emit('SpaceRemoveAssets', { assetIds: ['a1'], spaceId: 's1' });
    expect(userInteraction.recentSpaces).toBeUndefined();
  });
});

describe('recentSpacesDropdown', () => {
  it('defaults to true', () => {
    expect(get(recentSpacesDropdown)).toBe(true);
  });
});
