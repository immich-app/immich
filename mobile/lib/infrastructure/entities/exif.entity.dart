import 'package:drift/drift.dart' hide Query;
import 'package:immich_mobile/domain/models/exif.model.dart' as domain;
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';
import 'package:immich_mobile/infrastructure/utils/exif.converter.dart';
import 'package:isar/isar.dart';

part 'exif.entity.g.dart';

/// Exif information 1:1 relation with Asset
@Collection(inheritance: false)
class ExifInfo {
  final Id? id;
  final int? fileSize;
  final DateTime? dateTimeOriginal;
  final String? timeZone;
  final String? make;
  final String? model;
  final String? lens;
  final float? f;
  final float? mm;
  final short? iso;
  final float? exposureSeconds;
  final float? lat;
  final float? long;
  final String? city;
  final String? state;
  final String? country;
  final String? description;
  final String? orientation;

  const ExifInfo({
    this.id,
    this.fileSize,
    this.dateTimeOriginal,
    this.timeZone,
    this.make,
    this.model,
    this.lens,
    this.f,
    this.mm,
    this.iso,
    this.exposureSeconds,
    this.lat,
    this.long,
    this.city,
    this.state,
    this.country,
    this.description,
    this.orientation,
  });

  static ExifInfo fromDto(domain.ExifInfo dto) => ExifInfo(
        id: dto.assetId,
        fileSize: dto.fileSize,
        dateTimeOriginal: dto.dateTimeOriginal,
        timeZone: dto.timeZone,
        make: dto.make,
        model: dto.model,
        lens: dto.lens,
        f: dto.f,
        mm: dto.mm,
        iso: dto.iso?.toInt(),
        exposureSeconds: dto.exposureSeconds,
        lat: dto.latitude,
        long: dto.longitude,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        description: dto.description,
        orientation: dto.orientation,
      );

  domain.ExifInfo toDto() => domain.ExifInfo(
        assetId: id,
        fileSize: fileSize,
        description: description,
        orientation: orientation,
        timeZone: timeZone,
        dateTimeOriginal: dateTimeOriginal,
        isFlipped: ExifDtoConverter.isOrientationFlipped(orientation),
        latitude: lat,
        longitude: long,
        city: city,
        state: state,
        country: country,
        make: make,
        model: model,
        lens: lens,
        f: f,
        mm: mm,
        iso: iso?.toInt(),
        exposureSeconds: exposureSeconds,
      );
}

class ExifEntity extends Table with DriftDefaultsMixin {
  const ExifEntity();

  BlobColumn get assetId => blob()
      .references(RemoteAssetEntity, #remoteId, onDelete: KeyAction.cascade)();

  TextColumn get city => text().nullable()();

  TextColumn get state => text().nullable()();

  TextColumn get country => text().nullable()();

  DateTimeColumn get dateTimeOriginal => dateTime().nullable()();

  TextColumn get description => text().nullable()();

  IntColumn get height => integer().nullable()();

  IntColumn get width => integer().nullable()();

  TextColumn get exposureTime => text().nullable()();

  IntColumn get fNumber => integer().nullable()();

  IntColumn get fileSize => integer().nullable()();

  IntColumn get focalLength => integer().nullable()();

  IntColumn get latitude => integer().nullable()();

  IntColumn get longitude => integer().nullable()();

  IntColumn get iso => integer().nullable()();

  TextColumn get make => text().nullable()();

  TextColumn get model => text().nullable()();

  TextColumn get orientation => text().nullable()();

  TextColumn get timeZone => text().nullable()();

  IntColumn get rating => integer().nullable()();

  TextColumn get projectionType => text().nullable()();

  @override
  Set<Column> get primaryKey => {assetId};
}
