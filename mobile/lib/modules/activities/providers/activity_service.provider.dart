import 'package:immich_mobile/modules/activities/services/activity.service.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'activity_service.provider.g.dart';

@riverpod
ActivityService activityService(ActivityServiceRef ref) =>
    ActivityService(ref.watch(apiServiceProvider));
