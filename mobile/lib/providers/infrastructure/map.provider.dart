import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/repositories/map.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/domain/services/map.service.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

final mapRepositoryProvider = Provider<DriftMapRepository>(
  (ref) => DriftMapRepository(ref.watch(driftProvider)),
);

final mapServiceProvider = Provider<MapService>(
  (ref) {
    final timelineUsers = ref.watch(timelineUsersProvider).valueOrNull ?? [];
    final mapService = ref.watch(mapFactoryProvider).main(timelineUsers);
    ref.onDispose(mapService.dispose);
    return mapService;
  },
  // Empty dependencies to inform the framework that this provider
  // might be used in a ProviderScope
  dependencies: [],
);

final mapFactoryProvider = Provider<MapFactory>(
  (ref) => MapFactory(
    mapRepository: ref.watch(mapRepositoryProvider),
  ),
);
