import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/sync_stream.service.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_api.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_stream.repository.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/infrastructure/cancel.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final syncStreamServiceProvider = Provider(
  (ref) => SyncStreamService(
    syncApiRepository: ref.watch(syncApiRepositoryProvider),
    syncStreamRepository: ref.watch(syncStreamRepositoryProvider),
    cancelChecker: ref.watch(cancellationProvider),
  ),
);

final syncApiRepositoryProvider = Provider(
  (ref) => SyncApiRepository(ref.watch(apiServiceProvider)),
);

final syncStreamRepositoryProvider = Provider(
  (ref) => DriftSyncStreamRepository(ref.watch(driftProvider)),
);
