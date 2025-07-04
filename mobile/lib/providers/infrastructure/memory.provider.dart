import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/domain/services/memory.service.dart';
import 'package:immich_mobile/infrastructure/repositories/memory.repository.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'db.provider.dart';

final driftMemoryRepositoryProvider = Provider<DriftMemoryRepository>(
  (ref) => DriftMemoryRepository(ref.watch(driftProvider)),
);

final driftMemoryServiceProvider = Provider<DriftMemoryService>(
  (ref) => DriftMemoryService(ref.watch(driftMemoryRepositoryProvider)),
);

final driftMemoryFutureProvider =
    FutureProvider.autoDispose<List<DriftMemory>>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) {
    return [];
  }

  final service = ref.watch(driftMemoryServiceProvider);

  return service.getMemoryLane(user.id);
});
