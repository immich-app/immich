import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

final viewIntentMainTimelineReadyProvider = NotifierProvider<ViewIntentMainTimelineReadyNotifier, bool>(
  ViewIntentMainTimelineReadyNotifier.new,
);

class ViewIntentMainTimelineReadyNotifier extends Notifier<bool> {
  Completer<void>? _readyCompleter;
  bool _hasSeenMainTimeline = false;
  bool _hasTimelineUsers = false;
  bool _isTimelineReady = false;

  @override
  bool build() {
    _readyCompleter ??= Completer<void>();

    final timelineUsers = ref.watch(timelineUsersProvider).valueOrNull;
    final timelineService = ref.watch(timelineServiceProvider);
    final timelineStatus = ref.watch(timelineStatusProvider(timelineService)).valueOrNull ?? timelineService.status;

    _hasTimelineUsers = timelineUsers != null && timelineUsers.isNotEmpty;
    _isTimelineReady = timelineStatus == TimelineStatus.ready;

    final isReady = _computeReady();
    _completeWaitersIfReady(isReady);
    return isReady;
  }

  Future<void> wait({required Duration timeout}) {
    if (state) {
      return Future.value();
    }

    return _readyCompleter!.future.timeout(timeout);
  }

  void markMountedOnce() {
    _hasSeenMainTimeline = true;
    final isReady = _computeReady();
    state = isReady;
    _completeWaitersIfReady(isReady);
  }

  bool _computeReady() => _hasSeenMainTimeline && _hasTimelineUsers && _isTimelineReady;

  void _completeWaitersIfReady(bool isReady) {
    if (isReady) {
      if (!(_readyCompleter?.isCompleted ?? true)) {
        _readyCompleter?.complete();
      }
    } else if (_readyCompleter?.isCompleted ?? true) {
      _readyCompleter = Completer<void>();
    }
  }
}
