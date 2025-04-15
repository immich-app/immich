import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/utils/background_sync.dart';

final backgroundSyncProvider = Provider<BackgroundSyncManager>((ref) {
  final manager = BackgroundSyncManager();
  ref.onDispose(() => unawaited(manager.cancel()));
  return manager;
});
