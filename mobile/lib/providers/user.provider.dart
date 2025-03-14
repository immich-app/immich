import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:immich_mobile/services/timeline.service.dart';

class CurrentUserProvider extends StateNotifier<UserDto?> {
  CurrentUserProvider(this._userService) : super(null) {
    state = _userService.tryGetMyUser();
    streamSub =
        _userService.watchMyUser().listen((user) => state = user ?? state);
  }

  final UserService _userService;
  late final StreamSubscription<UserDto?> streamSub;

  refresh() async {
    try {
      await _userService.refreshMyUser();
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
  return CurrentUserProvider(ref.watch(userServiceProvider));
});

class TimelineUserIdsProvider extends StateNotifier<List<String>> {
  TimelineUserIdsProvider(this._timelineService) : super([]) {
    _timelineService.getTimelineUserIds().then((users) => state = users);
    streamSub = _timelineService
        .watchTimelineUserIds()
        .listen((users) => state = users);
  }

  late final StreamSubscription<List<String>> streamSub;
  final TimelineService _timelineService;

  @override
  void dispose() {
    streamSub.cancel();
    super.dispose();
  }
}

final timelineUsersIdsProvider =
    StateNotifierProvider<TimelineUserIdsProvider, List<String>>((ref) {
  return TimelineUserIdsProvider(ref.watch(timelineServiceProvider));
});
