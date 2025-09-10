import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/infrastructure/repositories/memory.repository.dart';
import 'package:logging/logging.dart';

class DriftMemoryService {
  final log = Logger("DriftMemoryService");

  final DriftMemoryRepository _repository;

  DriftMemoryService(this._repository);

  Future<List<DriftMemory>> getMemoryLane(String ownerId) {
    return _repository.getAll(ownerId);
  }

  Future<DriftMemory?> get(String memoryId) {
    return _repository.get(memoryId);
  }

  Future<int> getCount() {
    return _repository.getCount();
  }
}
