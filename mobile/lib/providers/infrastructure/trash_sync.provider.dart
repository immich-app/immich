import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/trash_sync.service.dart';
import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/repositories/permission.repository.dart';

final trashSyncRepositoryProvider = Provider<DriftTrashSyncRepository>(
  (ref) => DriftTrashSyncRepository(ref.watch(driftProvider)),
);

final trashSyncServiceProvider = Provider<TrashSyncService>(
  (ref) => TrashSyncService(
    repo: ref.watch(trashSyncRepositoryProvider),
    assetMediaApi: ref.watch(assetMediaApiProvider),
    permission: ref.watch(permissionRepositoryProvider),
    settings: ref.watch(settingsProvider),
  ),
);
