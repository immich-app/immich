import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/map/providers/map_marker.provider.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/exif_info.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';

final mapServiceProvider = Provider(
  (ref) => MapSerivce(
    ref.watch(apiServiceProvider),
    ref.watch(dbProvider),
  ),
);

class MapSerivce {
  final ApiService _apiService;
  final Isar _db;
  final log = Logger("MapService");

  MapSerivce(this._apiService, this._db);

  Future<List<AssetMapMarker>?> getMapMarkers(bool? isFavorite) async {
    try {
      final markers =
          await _apiService.assetApi.getMapMarkers(isFavorite: isFavorite);
      if (markers == null) {
        return null;
      }

      return markers
          .map(
            (m) => AssetMapMarker(
              latitude: m.lat,
              longitude: m.lon,
              assetId: m.id,
            ),
          )
          .toList();
    } catch (error, stack) {
      log.severe("Cannot get map markers ${error.toString()}", error, stack);
      return null;
    }
  }

  Future<Asset?> getAssetForMarker(String remoteId) async {
    try {
      final assets = await _db.assets.getAllByRemoteId([remoteId]);
      if (assets.isNotEmpty) return assets[0];

      final dto = await _apiService.assetApi.getAssetById(remoteId);
      if (dto == null) {
        return null;
      }
      return Asset.remote(dto);
    } catch (error, stack) {
      log.severe(
        "Cannot get asset for marker ${error.toString()}",
        error,
        stack,
      );
      return null;
    }
  }

  // TODO: Need to check if ExifInfo can be obtained from local DB
  Future<ExifInfo?> getExifInfoForMarker(String remoteId) async {
    try {
      final dto = await _apiService.assetApi.getAssetById(remoteId);
      if (dto == null || dto.exifInfo == null) {
        return null;
      }
      return ExifInfo.fromDto(dto.exifInfo!);
    } catch (error, stack) {
      log.severe(
        "Cannot get exif info for remote id ${error.toString()}",
        error,
        stack,
      );
      return null;
    }
  }
}
