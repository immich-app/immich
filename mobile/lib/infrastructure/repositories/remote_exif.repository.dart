import 'package:drift/drift.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/data/db/main/table/remote/exif.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_exif.repository.drift.dart';
import 'package:immich_mobile/utils/option.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

@DriftAccessor()
class RemoteExifRepository extends DatabaseAccessor<Drift> with $RemoteExifRepositoryMixin {
  RemoteExifRepository(super.attachedDatabase);

  Drift get _db => attachedDatabase;

  Future<void> updateExif(
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
