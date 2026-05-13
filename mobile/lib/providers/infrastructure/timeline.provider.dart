import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/infrastructure/repositories/timeline.repository.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/metadata.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';

final timelineRepositoryProvider = Provider<DriftTimelineRepository>(
  (ref) => DriftTimelineRepository(ref.watch(driftProvider)),
);

final timelineArgsProvider = Provider.autoDispose<TimelineArgs>(
  (ref) => throw UnimplementedError('Will be overridden through a ProviderScope.'),
);

final timelineServiceProvider = Provider<TimelineService>(
  (ref) {
    final timelineUsers = ref.watch(timelineUsersProvider).valueOrNull ?? [];
    final timelineService = ref.watch(timelineFactoryProvider).main(timelineUsers);
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
    metadataRepository: ref.watch(metadataProvider),
  ),
);

final timelineUsersProvider = StreamProvider<List<String>>((ref) {
  final currentUserId = ref.watch(currentUserProvider.select((u) => u?.id));
  if (currentUserId == null) {
    return Stream.value([]);
  }

  return ref.watch(timelineRepositoryProvider).watchTimelineUserIds(currentUserId);
});

final timelineStatusProvider = StreamProvider.autoDispose.family<TimelineStatus, TimelineService>((
  ref,
  timelineService,
) async* {
  yield timelineService.status;
  yield* timelineService.watchStatus();
});

Future<void> waitForTimelineReady(TimelineService timelineService, Duration timeout) {
  if (timelineService.isReady) {
    return Future.value();
  }

  return timelineService
      .watchStatus()
      .firstWhere((status) => status == TimelineStatus.ready)
      .timeout(timeout)
      .then((_) {});
}
