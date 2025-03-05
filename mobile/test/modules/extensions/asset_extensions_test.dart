import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/asset_extensions.dart';
import 'package:timezone/data/latest.dart';
import 'package:timezone/timezone.dart';

ExifInfo makeExif({
  DateTime? dateTimeOriginal,
  String? timeZone,
}) {
  return ExifInfo(
    dateTimeOriginal: dateTimeOriginal,
    timeZone: timeZone,
  );
}

Asset makeAsset({
  required String id,
  required DateTime createdAt,
  ExifInfo? exifInfo,
}) {
  return Asset(
    checksum: '',
    localId: id,
    remoteId: id,
    ownerId: 1,
    fileCreatedAt: createdAt,
    fileModifiedAt: DateTime.now(),
    updatedAt: DateTime.now(),
    durationInSeconds: 0,
    type: AssetType.image,
    fileName: id,
    isFavorite: false,
    isArchived: false,
    isTrashed: false,
    exifInfo: exifInfo,
  );
}

void main() {
  // Init Timezone DB
  initializeTimeZones();

  group("Returns local time and offset if no exifInfo", () {
    test('returns createdAt directly if in local', () {
      final createdAt = DateTime(2023, 12, 12, 12, 12, 12);
      final a = makeAsset(id: '1', createdAt: createdAt);
      final (dt, tz) = a.getTZAdjustedTimeAndOffset();

      expect(createdAt, dt);
      expect(createdAt.timeZoneOffset, tz);
    });

    test('returns createdAt in local if in utc', () {
      final createdAt = DateTime.utc(2023, 12, 12, 12, 12, 12);
      final a = makeAsset(id: '1', createdAt: createdAt);
      final (dt, tz) = a.getTZAdjustedTimeAndOffset();

      final localCreatedAt = createdAt.toLocal();
      expect(localCreatedAt, dt);
      expect(localCreatedAt.timeZoneOffset, tz);
    });
  });

  group("Returns dateTimeOriginal", () {
    test('Returns dateTimeOriginal in UTC from exifInfo without timezone', () {
      final createdAt = DateTime.parse("2023-01-27T14:00:00-0500");
      final dateTimeOriginal = DateTime.parse("2022-01-27T14:00:00+0530");
      final e = makeExif(dateTimeOriginal: dateTimeOriginal);
      final a = makeAsset(id: '1', createdAt: createdAt, exifInfo: e);
      final (dt, tz) = a.getTZAdjustedTimeAndOffset();

      final dateTimeInUTC = dateTimeOriginal.toUtc();
      expect(dateTimeInUTC, dt);
      expect(dateTimeInUTC.timeZoneOffset, tz);
    });

    test('Returns dateTimeOriginal in UTC from exifInfo with invalid timezone',
        () {
      final createdAt = DateTime.parse("2023-01-27T14:00:00-0500");
      final dateTimeOriginal = DateTime.parse("2022-01-27T14:00:00+0530");
      final e = makeExif(
        dateTimeOriginal: dateTimeOriginal,
        timeZone: "#_#",
      ); // Invalid timezone
      final a = makeAsset(id: '1', createdAt: createdAt, exifInfo: e);
      final (dt, tz) = a.getTZAdjustedTimeAndOffset();

      final dateTimeInUTC = dateTimeOriginal.toUtc();
      expect(dateTimeInUTC, dt);
      expect(dateTimeInUTC.timeZoneOffset, tz);
    });
  });

  group("Returns adjusted time if timezone available", () {
    test('With timezone as location', () {
      final createdAt = DateTime.parse("2023-01-27T14:00:00-0500");
      final dateTimeOriginal = DateTime.parse("2022-01-27T14:00:00+0530");
      const location = "Asia/Hong_Kong";
      final e =
          makeExif(dateTimeOriginal: dateTimeOriginal, timeZone: location);
      final a = makeAsset(id: '1', createdAt: createdAt, exifInfo: e);
      final (dt, tz) = a.getTZAdjustedTimeAndOffset();

      final adjustedTime =
          TZDateTime.from(dateTimeOriginal.toUtc(), getLocation(location));
      expect(adjustedTime, dt);
      expect(adjustedTime.timeZoneOffset, tz);
    });

    test('With timezone as offset', () {
      final createdAt = DateTime.parse("2023-01-27T14:00:00-0500");
      final dateTimeOriginal = DateTime.parse("2022-01-27T14:00:00+0530");
      const offset = "utc+08:00";
      final e = makeExif(dateTimeOriginal: dateTimeOriginal, timeZone: offset);
      final a = makeAsset(id: '1', createdAt: createdAt, exifInfo: e);
      final (dt, tz) = a.getTZAdjustedTimeAndOffset();

      final location = getLocation("Asia/Hong_Kong");
      final offsetFromLocation =
          Duration(milliseconds: location.currentTimeZone.offset);
      final adjustedTime = dateTimeOriginal.toUtc().add(offsetFromLocation);

      // Adds the offset to the actual time and returns the offset separately
      expect(adjustedTime, dt);
      expect(offsetFromLocation, tz);
    });
  });
}
