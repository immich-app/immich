import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/memories/models/memory.dart';
import 'package:immich_mobile/modules/memories/services/memory.service.dart';

final memoryFutureProvider = FutureProvider<List<Memory>?>((ref) async {
  final service = ref.watch(memoryServiceProvider);

  return await service.getMemoryLane();
});
