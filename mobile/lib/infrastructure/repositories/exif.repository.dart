import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.dart'
    as entity;
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:isar/isar.dart';

class IsarExifRepository extends IsarDatabaseRepository {
  final Isar _db;

  const IsarExifRepository(this._db) : super(_db);

  Future<void> delete(int assetId) async {
    await transaction(() async {
      await _db.exifInfos.delete(assetId);
    });
  }

  Future<void> deleteAll() async {
    await transaction(() async {
      await _db.exifInfos.clear();
    });
  }

  Future<ExifInfo?> get(int assetId) async {
    return (await _db.exifInfos.get(assetId))?.toDto();
  }

  Future<ExifInfo> update(ExifInfo exifInfo) {
    return transaction(() async {
      await _db.exifInfos.put(entity.ExifInfo.fromDto(exifInfo));
      return exifInfo;
    });
  }

  Future<List<ExifInfo>> updateAll(List<ExifInfo> exifInfos) {
    return transaction(() async {
      await _db.exifInfos.putAll(
        exifInfos.map(entity.ExifInfo.fromDto).toList(),
      );
      return exifInfos;
    });
  }
}

class DriftRemoteExifRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftRemoteExifRepository(this._db) : super(_db);

  Future<ExifInfo?> get(String assetId) {
    final query = _db.remoteExifEntity.select()
      ..where((exif) => exif.assetId.equals(assetId));

    return query.map((asset) => asset.toDto()).getSingleOrNull();
  }
}

extension on RemoteExifEntityData {
  ExifInfo toDto() {
    return ExifInfo(
      fileSize: fileSize,
      description: description,
      orientation: orientation,
      timeZone: timeZone,
      dateTimeOriginal: dateTimeOriginal,
      latitude: latitude,
      longitude: longitude,
      city: city,
      state: state,
      country: country,
      make: make,
      model: model,
      f: fNumber,
      iso: iso,
    );
  }
}
