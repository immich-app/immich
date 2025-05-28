import { SyncRequestType } from 'src/enum';
import { SYNC_TYPES_ORDER } from 'src/services/sync.service';

describe('types', () => {
  it('should have all the types in the ordering variable', () => {
    for (const key in SyncRequestType) {
      expect(SYNC_TYPES_ORDER).includes(key);
    }

    expect(SYNC_TYPES_ORDER.length).toBe(Object.keys(SyncRequestType).length);
  });
});
