import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/sync_stream.service.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_api.repository.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/repositories/user.repository.dart';

final syncStreamServiceProvider = Provider(
  (ref) => SyncStreamService(
    ref.watch(syncApiRepositoryProvider),
    ref.watch(userRepositoryProvider),
  ),
);

final syncApiRepositoryProvider = Provider(
  (ref) => SyncApiRepository(
    ref.watch(dbProvider),
    ref.watch(apiServiceProvider),
  ),
);
