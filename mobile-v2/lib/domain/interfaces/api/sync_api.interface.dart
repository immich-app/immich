import 'package:immich_mobile/domain/models/asset.model.dart';

abstract interface class ISyncApiRepository {
  /// Fetches the full assets for the user in batches
  Future<List<Asset>?> getFullSyncForUser({
    String? lastId,
    required int limit,
    required DateTime updatedUntil,
    String? userId,
  });
}
