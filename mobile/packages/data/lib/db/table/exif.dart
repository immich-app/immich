import 'package:drift/drift.dart' hide Query;
import 'package:immich_data/db/table/exif.drift.dart';
import 'package:immich_data/db/table/remote_asset.dart';
import 'package:immich_data/db/util/defaults_mixin.dart';
import 'package:immich_data/db/util/exif_converter.dart';
import 'package:immich_data/model/exif.dart' as domain;

@TableIndex.sql('CREATE INDEX IF NOT EXISTS idx_lat_lng ON remote_exif_entity (latitude, longitude)')
@TableIndex.sql('''
CREATE INDEX IF NOT EXISTS idx_remote_exif_city
ON remote_exif_entity (city) WHERE city IS NOT NULL
''')
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
    f: fNumber,
    mm: focalLength,
    lens: lens,
    isFlipped: ExifDtoConverter.isOrientationFlipped(orientation),
    exposureSeconds: ExifDtoConverter.exposureTimeToSeconds(exposureTime),
  );
}
