import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

final mapServiceProvider = Provider(
  (ref) => MapSerivce(
    ref.read(apiServiceProvider),
    ref.read(dbProvider),
  ),
);

class MapSerivce {
  final ApiService _apiService;
  final Isar _db;
  final _log = Logger("MapService");

  MapSerivce(this._apiService, this._db);

  Future<List<MapMarkerResponseDto>> getMapMarkers({
    bool? isFavorite,
    bool? withArchived,
    DateTime? fileCreatedAfter,
    DateTime? fileCreatedBefore,
  }) async {
    try {
      final markers = await _apiService.assetApi.getMapMarkers(
        isFavorite: isFavorite,
        isArchived: withArchived,
        fileCreatedAfter: fileCreatedAfter,
        fileCreatedBefore: fileCreatedBefore,
      );

      return markers ?? [];
    } catch (error, stack) {
      _log.severe("Cannot get map markers ${error.toString()}", error, stack);
      return [];
    }
  }

  Future<Asset?> getAssetForMarkerId(String remoteId) async {
    try {
      final assets = await _db.assets.getAllByRemoteId([remoteId]);
      if (assets.isNotEmpty) return assets[0];

      final dto = await _apiService.assetApi.getAssetById(remoteId);
      if (dto == null) return null;
      return _db.assets.getByRemoteId(dto.id);
    } catch (error, stack) {
      _log.severe(
        "Cannot get asset for marker ${error.toString()}",
        error,
        stack,
      );
      return null;
    }
  }
}
