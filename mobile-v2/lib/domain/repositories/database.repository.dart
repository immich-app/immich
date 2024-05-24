import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:immich_mobile/domain/entities/album.entity.dart';
import 'package:immich_mobile/domain/entities/asset.entity.dart';
import 'package:immich_mobile/domain/entities/log.entity.dart';
import 'package:immich_mobile/domain/entities/store.entity.dart';
import 'package:immich_mobile/domain/interfaces/database.interface.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqlite3/sqlite3.dart';
import 'package:sqlite3_flutter_libs/sqlite3_flutter_libs.dart';

import 'database.repository.drift.dart';

@DriftDatabase(tables: [Logs, Store, LocalAlbum, LocalAsset])
class DriftDatabaseRepository extends $DriftDatabaseRepository
    implements IDatabaseRepository<GeneratedDatabase> {
  DriftDatabaseRepository() : super(_openConnection());

  static LazyDatabase _openConnection() {
    return LazyDatabase(() async {
      final dbFolder = await getApplicationDocumentsDirectory();
      final file = File(p.join(dbFolder.path, 'db.sqlite'));

      // Work around limitations on old Android versions
      // https://github.com/simolus3/sqlite3.dart/tree/main/sqlite3_flutter_libs#problems-on-android-6
      if (Platform.isAndroid) {
        await applyWorkaroundToOpenSqlite3OnOldAndroidVersions();
      }

      // Make sqlite3 pick a more suitable location for temporary files - the
      // one from the system may be inaccessible due to sandboxing.
      // https://github.com/simolus3/moor/issues/876#issuecomment-710013503
      final cachebase = (await getTemporaryDirectory()).path;
      // We can't access /tmp on Android, which sqlite3 would try by default.
      // Explicitly tell it about the correct temporary directory.
      sqlite3.tempDirectory = cachebase;

      return NativeDatabase.createInBackground(file);
    });
  }

  @override
  GeneratedDatabase init() => this;

  @override
  int get schemaVersion => 1;

  @override
  // ignore: no-empty-block
  void migrateDB() {
    // No migrations yet
  }
}
