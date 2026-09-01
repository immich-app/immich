import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/services/trash_sync.service.dart';
import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/repositories/permission.repository.dart';

final trashSyncRepositoryProvider = Provider<TrashSyncRepository>(
  (ref) => ref.watch(driftProvider.select((db) => db.trashSyncRepository)),
);

final pendingTrashReviewCountProvider = StreamProvider.autoDispose<int>((ref) {
  final enabledReviewMode = ref.watch(
    appConfigProvider.select((config) => config.trashSyncMode == TrashSyncMode.review),
  );

  if (!enabledReviewMode) {
    return Stream<int>.value(0);
  }

  return ref.watch(trashSyncRepositoryProvider).watchPendingReviewCount();
});

final trashSyncServiceProvider = Provider<TrashSyncService>(
  (ref) => TrashSyncService(
    repo: ref.watch(driftProvider.select((db) => db.trashSyncRepository)),
    assetMediaApi: ref.watch(assetMediaApiProvider),
    permission: ref.watch(permissionRepositoryProvider),
    settings: ref.watch(settingsProvider),
  ),
);
