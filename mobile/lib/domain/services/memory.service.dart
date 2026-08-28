import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/infrastructure/repositories/memory.repository.dart';
import 'package:logging/logging.dart';

/// Accesses Memories; a specialized collection of assets with some novel display mechanism
class MemoryService {
  final log = Logger("MemoryService");

  final MemoryRepository _repository;

  MemoryService(this._repository);

  Future<List<Memory>> getMemoryLane(String ownerId) {
    return _repository.getAll(ownerId);
  }

  Future<List<Memory>> getAll(String ownerId, {bool onlyFavorites = false}) {
    return _repository.getAll(ownerId, onlyToday: false, onlyFavorites: onlyFavorites);
  }

  Future<Memory?> get(String memoryId) {
    return _repository.get(memoryId);
  }

  Future<int> getCount() {
    return _repository.getCount();
  }
}
