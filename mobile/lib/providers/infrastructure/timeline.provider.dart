import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/interfaces/timeline.interface.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/infrastructure/repositories/timeline.repository.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';

final timelineRepositoryProvider = Provider<ITimelineRepository>(
  (ref) => DriftTimelineRepository(ref.watch(driftProvider)),
);

final timelineArgsProvider = Provider.autoDispose<TimelineArgs>(
  (ref) =>
      throw UnimplementedError('Will be overridden through a ProviderScope.'),
);

final timelineServiceProvider = Provider.autoDispose<TimelineService>(
  (ref) =>
      throw UnimplementedError('Will be overridden through a ProviderScope.'),
);

final timelineFactoryProvider = Provider<TimelineFactory>(
  (ref) => TimelineFactory(
    timelineRepository: ref.watch(timelineRepositoryProvider),
    settingsService: ref.watch(settingsProvider),
  ),
);
