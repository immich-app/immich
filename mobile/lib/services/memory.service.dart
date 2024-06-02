import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/models/memories/memory.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

import '../utils/string_helper.dart';

final memoryServiceProvider = StateProvider<MemoryService>((ref) {
  return MemoryService(
    ref.watch(apiServiceProvider),
    ref.watch(dbProvider),
  );
});

class MemoryService {
  final log = Logger("MemoryService");

  final ApiService _apiService;
  final Isar _db;

  MemoryService(this._apiService, this._db);

  Future<List<Memory>?> getMemoryLane() async {
    try {
      final now = DateTime.now();
      final data = await _apiService.assetsApi.getMemoryLane(
        now.day,
        now.month,
      );

      if (data == null) {
        return null;
      }

      List<Memory> memories = [];
      for (final MemoryLaneResponseDto(:yearsAgo, :assets) in data) {
        final dbAssets =
            await _db.assets.getAllByRemoteId(assets.map((e) => e.id));
        if (dbAssets.isNotEmpty) {
          memories.add(
            Memory(
              title: '$yearsAgo year${s(yearsAgo)} ago',
              assets: dbAssets,
            ),
          );
        }
      }

      return memories.isNotEmpty ? memories : null;
    } catch (error, stack) {
      log.severe("Cannot get memories", error, stack);
      return null;
    }
  }
}
