import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/user.service.dart';

class CurrentUserProvider extends StateNotifier<User?> {
  CurrentUserProvider(this._apiService) : super(null) {
    state = Store.tryGet(StoreKey.currentUser);
    streamSub =
        Store.watch(StoreKey.currentUser).listen((user) => state = user);
  }

  final ApiService _apiService;
  late final StreamSubscription<User?> streamSub;

  refresh() async {
    try {
      final user = await _apiService.usersApi.getMyUser();
      final userPreferences = await _apiService.usersApi.getMyPreferences();
      if (user != null) {
        await Store.put(
          StoreKey.currentUser,
          User.fromUserDto(user, userPreferences),
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
    StateNotifierProvider<CurrentUserProvider, User?>((ref) {
  return CurrentUserProvider(
    ref.watch(apiServiceProvider),
  );
});

class TimelineUserIdsProvider extends StateNotifier<List<int>> {
  TimelineUserIdsProvider(this._userService) : super([]) {
    _userService.getTimelineUserIds().then((users) => state = users);
    streamSub =
        _userService.watchTimelineUserIds().listen((users) => state = users);
  }

  late final StreamSubscription<List<int>> streamSub;
  final UserService _userService;

  @override
  void dispose() {
    streamSub.cancel();
    super.dispose();
  }
}

final timelineUsersIdsProvider =
    StateNotifierProvider<TimelineUserIdsProvider, List<int>>((ref) {
  return TimelineUserIdsProvider(ref.watch(userServiceProvider));
});
