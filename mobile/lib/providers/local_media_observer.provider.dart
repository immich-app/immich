import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/utils/local_media_observer.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';

final localMediaObserverProvider = Provider<LocalMediaObserver>((ref) {
  final backgroundSync = ref.watch(backgroundSyncProvider);

  final observer = LocalMediaObserver(
    changes: streamMediaChanges,
    onChange: (isCancelled) async {
      await backgroundSync.syncLocal(enqueue: true);
      if (isCancelled()) {
        return;
      }

      await backgroundSync.hashAssets(enqueue: true);
    },
  );
  ref.onDispose(observer.stop);
  return observer;
});
