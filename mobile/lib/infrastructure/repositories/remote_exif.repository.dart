import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/utils/option.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class RemoteExifRepository extends DriftDatabaseRepository {
  final Drift _db;

  const RemoteExifRepository(this._db) : super(_db);

  Future<void> update(
    List<String> ids, {
    Option<DateTime> dateTimeOriginal = const .none(),
    Option<String> timeZone = const .none(),
    Option<LatLng> location = const .none(),
  }) async {
    if ([dateTimeOriginal, timeZone, location].every((option) => option.isNone)) {
      return;
    }

    final companion = RemoteExifEntityCompanion(
      dateTimeOriginal: dateTimeOriginal.toDriftValue(),
      timeZone: timeZone.toDriftValue(),
      latitude: location.map((loc) => loc.latitude).toDriftValue(),
      longitude: location.map((loc) => loc.longitude).toDriftValue(),
    );

    return _db.batch((batch) {
      for (final id in ids) {
        batch.update(_db.remoteExifEntity, companion, where: (a) => a.assetId.equals(id));
      }
    });
  }
}
