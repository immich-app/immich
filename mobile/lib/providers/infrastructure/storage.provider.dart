import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';

final storageRepositoryProvider = Provider<StorageRepository>(
  (ref) => const StorageRepository(),
);
