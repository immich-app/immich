import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/repositories/map.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/domain/services/map.service.dart';
import 'package:immich_mobile/providers/user.provider.dart';

final mapRepositoryProvider = Provider<DriftMapRepository>((ref) => DriftMapRepository(ref.watch(driftProvider)));

final mapServiceProvider = Provider<MapService>(
  (ref) {
    final user = ref.watch(currentUserProvider);
    if (user == null) {
      throw Exception('User must be logged in to access map');
    }

    final mapService = ref.watch(mapFactoryProvider).remote(user.id);
    return mapService;
  },
  // Empty dependencies to inform the framework that this provider
  // might be used in a ProviderScope
  dependencies: const [],
);

final mapFactoryProvider = Provider<MapFactory>((ref) => MapFactory(mapRepository: ref.watch(mapRepositoryProvider)));
