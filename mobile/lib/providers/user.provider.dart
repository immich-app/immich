import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/utils/user.converter.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/timeline.service.dart';

class CurrentUserProvider extends StateNotifier<UserDto?> {
  CurrentUserProvider(this._apiService) : super(null) {
    state = Store.tryGet(StoreKey.currentUser);
    streamSub =
        Store.watch(StoreKey.currentUser).listen((user) => state = user);
  }

  final ApiService _apiService;
  late final StreamSubscription<UserDto?> streamSub;

  refresh() async {
    try {
      final user = await _apiService.usersApi.getMyUser();
      final userPreferences = await _apiService.usersApi.getMyPreferences();
      if (user != null) {
        await Store.put(
          StoreKey.currentUser,
          UserConverter.fromAdminDto(user, userPreferences),
        );
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    streamSub.cancel();
    super.dispose();
  }
}

final currentUserProvider =
    StateNotifierProvider<CurrentUserProvider, UserDto?>((ref) {
  return CurrentUserProvider(
    ref.watch(apiServiceProvider),
  );
});

class TimelineUserIdsProvider extends StateNotifier<List<int>> {
  TimelineUserIdsProvider(this._timelineService) : super([]) {
    _timelineService.getTimelineUserIds().then((users) => state = users);
    streamSub = _timelineService
        .watchTimelineUserIds()
        .listen((users) => state = users);
  }

  late final StreamSubscription<List<int>> streamSub;
  final TimelineService _timelineService;

  @override
  void dispose() {
    streamSub.cancel();
    super.dispose();
  }
}

final timelineUsersIdsProvider =
    StateNotifierProvider<TimelineUserIdsProvider, List<int>>((ref) {
  return TimelineUserIdsProvider(ref.watch(timelineServiceProvider));
});
