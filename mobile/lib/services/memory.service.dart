import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/interfaces/asset.interface.dart';
import 'package:immich_mobile/models/memories/memory.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/asset.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:logging/logging.dart';

final memoryServiceProvider = StateProvider<MemoryService>((ref) {
  return MemoryService(
    ref.watch(apiServiceProvider),
    ref.watch(assetRepositoryProvider),
  );
});

class MemoryService {
  final log = Logger("MemoryService");

  final ApiService _apiService;
  final IAssetRepository _assetRepository;

  MemoryService(this._apiService, this._assetRepository);

  Future<List<Memory>?> getMemoryLane() async {
    try {
      final now = DateTime.now();
      final data = await _apiService.memoriesApi.searchMemories(
        for_: DateTime.utc(now.year, now.month, now.day, 0, 0, 0),
      );

      if (data == null) {
        return null;
      }

      List<Memory> memories = [];

      for (final memory in data) {
        final dbAssets = await _assetRepository
            .getAllByRemoteId(memory.assets.map((e) => e.id));
        final yearsAgo = now.year - memory.data.year;
        if (dbAssets.isNotEmpty) {
          final String title = 'years_ago'.t(
            args: {
              'years': yearsAgo.toString(),
            },
          );
          memories.add(
            Memory(
              title: title,
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

  Future<Memory?> getMemoryById(String id) async {
    try {
      final memoryResponse = await _apiService.memoriesApi.getMemory(id);

      if (memoryResponse == null) {
        return null;
      }
      final dbAssets = await _assetRepository
          .getAllByRemoteId(memoryResponse.assets.map((e) => e.id));
      if (dbAssets.isEmpty) {
        log.warning("No assets found for memory with ID: $id");
        return null;
      }
      final yearsAgo = DateTime.now().year - memoryResponse.data.year;
      final String title = 'years_ago'.t(
        args: {
          'years': yearsAgo.toString(),
        },
      );

      return Memory(
        title: title,
        assets: dbAssets,
      );
    } catch (error, stack) {
      log.severe("Cannot get memory with ID: $id", error, stack);
      return null;
    }
  }
}
