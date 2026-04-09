import 'package:drift/drift.dart' hide Query;
import 'package:immich_mobile/domain/models/exif.model.dart' as domain;
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';
import 'package:immich_mobile/infrastructure/utils/exif.converter.dart';

@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_lat_lng ON remote_exif_entity (latitude, longitude)')
class RemoteExifEntity extends Table with DriftDefaultsMixin {
  const RemoteExifEntity();

  TextColumn get assetId => text().references(RemoteAssetEntity, #id, onDelete: KeyAction.cascade)();

  TextColumn get city => text().nullable()();

  TextColumn get state => text().nullable()();

  TextColumn get country => text().nullable()();

  DateTimeColumn get dateTimeOriginal => dateTime().nullable()();

  TextColumn get description => text().nullable()();

  IntColumn get height => integer().nullable()();

  IntColumn get width => integer().nullable()();

  TextColumn get exposureTime => text().nullable()();

  RealColumn get fNumber => real().nullable()();

  IntColumn get fileSize => integer().nullable()();

  RealColumn get focalLength => real().nullable()();

  RealColumn get latitude => real().nullable()();

  RealColumn get longitude => real().nullable()();

  IntColumn get iso => integer().nullable()();

  TextColumn get make => text().nullable()();

  TextColumn get model => text().nullable()();

  TextColumn get lens => text().nullable()();

  TextColumn get orientation => text().nullable()();

  TextColumn get timeZone => text().nullable()();

  IntColumn get rating => integer().nullable()();

  TextColumn get projectionType => text().nullable()();

  @override
  Set<Column> get primaryKey => {assetId};
}

extension RemoteExifEntityDataDomainEx on RemoteExifEntityData {
  domain.ExifInfo toDto() => domain.ExifInfo(
    fileSize: fileSize,
    dateTimeOriginal: dateTimeOriginal,
    rating: rating,
    width: width,
    height: height,
    timeZone: timeZone,
    make: make,
    model: model,
    iso: iso,
    city: city,
    state: state,
    country: country,
    description: description,
    orientation: orientation,
    latitude: latitude,
    longitude: longitude,
    f: fNumber?.toDouble(),
    mm: focalLength?.toDouble(),
    lens: lens,
    isFlipped: ExifDtoConverter.isOrientationFlipped(orientation),
    exposureSeconds: ExifDtoConverter.exposureTimeToSeconds(exposureTime),
  );
}
