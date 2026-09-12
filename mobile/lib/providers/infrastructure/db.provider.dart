import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/data/store.dart';

Drift Function(Ref ref) driftOverride(Drift drift) => (ref) {
  ref.onDispose(() => unawaited(drift.close()));
  ref.keepAlive();
  return drift;
};

/// Direct database access for the repositories that have not yet been migrated to `Store`
// TODO(rewrite): Remove this provider once all repositories have migrated to `Store`
final driftProvider = Store.db;
