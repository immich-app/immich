import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/infrastructure/repositories/timeline.repository.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';

final timelineRepositoryProvider = Provider<DriftTimelineRepository>(
  (ref) => DriftTimelineRepository(ref.watch(driftProvider)),
);

final timelineArgsProvider = NotifierProvider.autoDispose<TimelineArgsNotifier, TimelineArgs>(
  TimelineArgsNotifier.new,
  dependencies: const [],
);

class TimelineArgsNotifier extends Notifier<TimelineArgs> {
  TimelineArgsNotifier({
    double initialMaxWidth = 0,
    double initialMaxHeight = 0,
    this.showStorageIndicator = false,
    this.withStack = false,
    this.groupBy,
  }) : _maxWidth = initialMaxWidth,
       _maxHeight = initialMaxHeight;

  double _maxWidth;
  double _maxHeight;
  final bool showStorageIndicator;
  final bool withStack;
  final GroupAssetsBy? groupBy;

  @override
  TimelineArgs build() {
    final columnCount = ref.watch(settingsProvider.select((s) => s.get(Setting.tilesPerRow)));
    return TimelineArgs(
      maxWidth: _maxWidth,
      maxHeight: _maxHeight,
      columnCount: columnCount,
      showStorageIndicator: showStorageIndicator,
      withStack: withStack,
      groupBy: groupBy,
    );
  }

  void updateConstraints({required double maxWidth, required double maxHeight}) {
    if (_maxWidth == maxWidth && _maxHeight == maxHeight) return;
    _maxWidth = maxWidth;
    _maxHeight = maxHeight;
    state = state.copyWith(maxWidth: maxWidth, maxHeight: maxHeight);
  }
}

final timelineServiceProvider = Provider<TimelineService>(
  (ref) {
    final timelineUsers = ref.watch(timelineUsersProvider).value ?? [];
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
    settingsService: ref.watch(settingsProvider),
  ),
);

final timelineUsersProvider = StreamNotifierProvider<_TimelineUsersNotifier, List<String>>(_TimelineUsersNotifier.new);

class _TimelineUsersNotifier extends StreamNotifier<List<String>> {
  @override
  Stream<List<String>> build() {
    final currentUserId = ref.watch(currentUserProvider.select((u) => u?.id));
    if (currentUserId == null) {
      return Stream.value([]);
    }

    return ref.watch(timelineRepositoryProvider).watchTimelineUserIds(currentUserId);
  }

  @override
  bool updateShouldNotify(AsyncValue<List<String>> previous, AsyncValue<List<String>> next) {
    final listEquals = const DeepCollectionEquality().equals;
    return !listEquals(previous.value, next.value);
  }
}
