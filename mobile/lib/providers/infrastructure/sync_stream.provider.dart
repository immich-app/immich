import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/sync_stream.service.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_api.repository.dart';
import 'package:immich_mobile/providers/api.provider.dart';

final syncStreamServiceProvider = Provider(
  (ref) {
    final instance = SyncStreamService(
      ref.watch(syncApiRepositoryProvider),
    );

    ref.onDispose(() => unawaited(instance.dispose()));

    return instance;
  },
);

final syncApiRepositoryProvider = Provider(
  (ref) => SyncApiRepository(
    ref.watch(apiServiceProvider),
  ),
);
