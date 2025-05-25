import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/interfaces/timeline.interface.dart';
import 'package:immich_mobile/infrastructure/repositories/timeline.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final timelineRepositoryProvider = Provider<ITimelineRepository>(
  (ref) => DriftTimelineRepository(ref.watch(driftProvider)),
);
