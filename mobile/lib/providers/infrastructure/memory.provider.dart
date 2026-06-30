import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/domain/services/memory.service.dart';
import 'package:immich_mobile/infrastructure/repositories/memory.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';

final driftMemoryRepositoryProvider = Provider<DriftMemoryRepository>(
  (ref) => DriftMemoryRepository(ref.watch(driftProvider)),
);

final driftMemoryServiceProvider = Provider<DriftMemoryService>(
  (ref) => DriftMemoryService(ref.watch(driftMemoryRepositoryProvider)),
);

final driftMemoryFutureProvider = FutureProvider.autoDispose<List<DriftMemory>>((ref) {
  final (userId, enabled) = ref.watch(currentUserProvider.select((user) => (user?.id, user?.memoryEnabled ?? true)));
  if (userId == null || !enabled) {
    return const [];
  }

  final now = DateTime.now();
  final nextMidnight = DateTime(now.year, now.month, now.day + 1);
  final timer = Timer(nextMidnight.difference(now) + const Duration(seconds: 5), ref.invalidateSelf);
  ref.onDispose(timer.cancel);

  final service = ref.watch(driftMemoryServiceProvider);
  return service.getMemoryLane(userId);
});
