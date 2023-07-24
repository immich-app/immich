import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/memories/models/memory.dart';
import 'package:immich_mobile/modules/memories/services/memory.service.dart';

/// A notifier to be used with the Memory Lane service. Sets the date, and
/// will update the date to now on app resume so that the memory provider
/// can update accordingly
class TodayNotifier extends StateNotifier<DateTime> {
  TodayNotifier() : super(DateTime.now());

  /// Sets the time to now to refresh today
  void update() {
    state = DateTime.now();
  }
}

final todayProvider = StateNotifierProvider<TodayNotifier, DateTime>((ref) {
  return TodayNotifier();
});

final memoryFutureProvider =
    FutureProvider.autoDispose<List<Memory>?>((ref) async {
  final service = ref.watch(memoryServiceProvider);
  final today = ref.watch(todayProvider);

  return await service.getMemoryLane(now: today);
});
