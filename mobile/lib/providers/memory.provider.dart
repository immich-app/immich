import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/repositories/memory.repository.dart';
import 'package:immich_mobile/models/memories/memory.model.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/services/memory.service.dart';

final memoryFutureProvider =
    FutureProvider.autoDispose<List<Memory>?>((ref) async {
  final service = ref.watch(memoryServiceProvider);

  return await service.getMemoryLane();
});

final driftMemoryProvider = Provider<DriftMemoryRepository>(
  (ref) => DriftMemoryRepository(ref.watch(driftProvider)),
);
