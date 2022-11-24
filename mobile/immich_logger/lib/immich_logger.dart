library immich_logger;

import 'package:flutter/widgets.dart';
import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

/// ImmichLogger.
class ImmichLogger {
  late final Database db;
  late final String dbPath;

  void _createLogTableV1(Batch batch) {
    batch.execute('drop table if exists immich_logs');

    batch.execute('''
    create table immich_logs (
      id integer primary key autoincrement,
      message text not null,
      level text not null default 'info', 
      created_at datetime default current_timestamp
    )''');
  }

  init() async {
    debugPrint('Initialize ImmichLogger()');
    dbPath = join(await getDatabasesPath(), 'immich_logging_database.db');
    // deleteDatabase(dbPath);

    var isDbExist = await databaseExists(dbPath);

    if (!isDbExist) {
      debugPrint("Logger database not exist, creating a new one");
      db = await openDatabase(
        dbPath,
        singleInstance: true,
        version: 1,
        onCreate: (db, version) async {
          var batch = db.batch();
          _createLogTableV1(batch);
          await batch.commit();
        },
        onDowngrade: onDatabaseDowngradeDelete,
      );
    } else {
      debugPrint("Opening existing logger database");
    }
  }
}
