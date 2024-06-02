import { uniqueIdStore } from '$lib/stores/unique-id.store';

describe('uniqueIdStore', () => {
  afterEach(() => {
    uniqueIdStore.update(() => -1);
  });

  it('should generate unique ids', () => {
    const { generateId } = uniqueIdStore;
    const ids = [generateId(), generateId(), generateId()];

    expect(ids).toEqual(['id-0', 'id-1', 'id-2']);
  });
});
