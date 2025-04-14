import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/utils/background_sync.dart';

final backgroundSyncProvider = Provider<BackgroundSyncManager>(
  (ref) => BackgroundSyncManager(),
);
