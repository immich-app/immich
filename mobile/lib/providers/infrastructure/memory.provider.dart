import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/domain/services/memory.service.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';

final driftMemoryLaneProvider = FutureProvider.autoDispose<List<DriftMemory>>((ref) {
  final (userId, enabled) = ref.watch(currentUserProvider.select((user) => (user?.id, user?.memoryEnabled ?? true)));
  if (userId == null || !enabled) {
    return const [];
  }

  final now = DateTime.now();
  final nextMidnight = DateTime(now.year, now.month, now.day + 1);
  final timer = Timer(nextMidnight.difference(now) + const Duration(seconds: 5), ref.invalidateSelf);
  ref.onDispose(timer.cancel);

  final service = DriftMemoryService(ref.watch(driftProvider).memoryRepository);
  return service.getMemoryLane(userId);
});

final driftAllMemoriesProvider = FutureProvider.autoDispose.family<List<DriftMemory>, bool>((ref, onlyFavorites) {
  final (userId, enabled) = ref.watch(currentUserProvider.select((user) => (user?.id, user?.memoryEnabled ?? true)));
  if (userId == null || !enabled) {
    return const [];
  }

  final service = DriftMemoryService(ref.watch(driftProvider).memoryRepository);
  return service.getAll(userId, onlyFavorites: onlyFavorites);
});
