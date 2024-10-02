import 'package:immich_mobile/repositories/activity_api.repository.dart';
import 'package:immich_mobile/services/activity.service.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'activity_service.provider.g.dart';

@riverpod
ActivityService activityService(ActivityServiceRef ref) =>
    ActivityService(ref.watch(activityApiRepositoryProvider));
