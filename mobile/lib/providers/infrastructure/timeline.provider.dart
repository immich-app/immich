import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/infrastructure/repositories/timeline.repository.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';

final timelineRepositoryProvider = Provider<DriftTimelineRepository>(
  (ref) => DriftTimelineRepository(ref.watch(driftProvider)),
);

final timelineArgsProvider = Provider.autoDispose<TimelineArgs>(
  (ref) =>
      throw UnimplementedError('Will be overridden through a ProviderScope.'),
);

final timelineServiceProvider = Provider<TimelineService>(
  (ref) {
    final timelineUsers = ref.watch(timelineUsersProvider).valueOrNull ?? [];
    final timelineService =
        ref.watch(timelineFactoryProvider).main(timelineUsers);
    ref.onDispose(timelineService.dispose);
    return timelineService;
  },
  // Empty dependencies to inform the framework that this provider
  // might be used in a ProviderScope
  dependencies: [],
);

final timelineFactoryProvider = Provider<TimelineFactory>(
  (ref) => TimelineFactory(
    timelineRepository: ref.watch(timelineRepositoryProvider),
    settingsService: ref.watch(settingsProvider),
  ),
);

final timelineUsersProvider = StreamProvider<List<String>>(
  (ref) {
    final currentUserId = ref.watch(currentUserProvider.select((u) => u?.id));
    if (currentUserId == null) {
      return Stream.value([]);
    }

    return ref
        .watch(timelineRepositoryProvider)
        .watchTimelineUserIds(currentUserId);
  },
);
