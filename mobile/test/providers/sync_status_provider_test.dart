import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/sync_status.provider.dart';

void main() {
  group('syncStatusProvider', () {
    test('markRemoteContentChanged increments content version without changing sync status', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      expect(container.read(syncStatusProvider).remoteContentChangedCount, 0);
      expect(container.read(syncStatusProvider).remoteSyncStatus, SyncStatus.idle);

      container.read(syncStatusProvider.notifier).markRemoteContentChanged();

      expect(container.read(syncStatusProvider).remoteContentChangedCount, 1);
      expect(container.read(syncStatusProvider).remoteSyncStatus, SyncStatus.idle);
    });

    test('completeRemoteSync also marks remote content as changed', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(syncStatusProvider.notifier).startRemoteSync();
      container.read(syncStatusProvider.notifier).completeRemoteSync();

      expect(container.read(syncStatusProvider).remoteContentChangedCount, 1);
      expect(container.read(syncStatusProvider).remoteSyncStatus, SyncStatus.success);
    });
  });
}
