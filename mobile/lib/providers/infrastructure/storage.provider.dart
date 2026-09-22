import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';

final storageRepositoryProvider = Provider<StorageRepository>(
  (ref) => StorageRepository(ref.watch(assetMediaApiProvider)),
);
