import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';

final timelineArgsProvider = Provider.autoDispose<TimelineArgs>(
  (ref) => throw UnimplementedError('Will be overridden through a ProviderScope.'),
);

class AssetOriginFilterNotifier extends Notifier<AssetOriginFilter> {
  @override
  AssetOriginFilter build() => AssetOriginFilter.all;

  void setFilter(AssetOriginFilter filter) => state = filter;
}

final assetOriginFilterProvider = NotifierProvider<AssetOriginFilterNotifier, AssetOriginFilter>(
  AssetOriginFilterNotifier.new,
);

final timelineServiceProvider = Provider<TimelineService>(
  (ref) {
    final timelineUsers = ref.watch(timelineUsersProvider).valueOrNull ?? [];
    final filter = ref.watch(assetOriginFilterProvider);
    final timelineService = ref.watch(timelineFactoryProvider).main(timelineUsers, filter);
    ref.onDispose(timelineService.dispose);
    return timelineService;
  },
  // Empty dependencies to inform the framework that this provider
  // might be used in a ProviderScope
  dependencies: const [],
);

final timelineFactoryProvider = Provider<TimelineFactory>(
  (ref) => TimelineFactory(
    timelineRepository: ref.watch(driftProvider).timelineRepository,
    settingsRepository: ref.watch(settingsProvider),
  ),
);

final timelineUsersProvider = StreamProvider<List<String>>((ref) {
  final currentUserId = ref.watch(currentUserProvider.select((u) => u?.id));
  if (currentUserId == null) {
    return Stream.value([]);
  }

  // Drift re-emits a fresh but content-identical list on unrelated table updates,
  // which would dispose and rebuild the timeline service mid-load
  return ref
      .watch(driftProvider)
      .timelineRepository
      .watchTimelineUserIds(currentUserId)
      .distinct(const ListEquality<String>().equals);
});
