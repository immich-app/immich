import 'dart:io';

import 'package:drift/drift.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/infrastructure/entities/store.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:sqlite3_connection_pool/sqlite3_connection_pool.dart';
import 'package:sqlite_async/sqlite_async.dart';

void main() {
  late Directory dir;
  late String path;

  Future<(Drift, SqliteDatabase, SqliteConnectionPool)> openDb() async {
    final sqliteDb = SqliteDatabase.withFactory(ImmichSqliteOpenFactory(path: path));
    await sqliteDb.initialize();
    final pool = SqliteConnectionPool.open(
      name: path,
      openConnections: () => throw StateError('pool should already be open'),
    );
    return (Drift.sqlite(sqliteDb, pool), sqliteDb, pool);
  }

  setUp(() async {
    dir = await Directory.systemTemp.createTemp('drift_pool_stream');
    path = '${dir.path}/immich.sqlite';
  });

  tearDown(() async {
    await dir.delete(recursive: true);
  });

  test('watch() in main isolate sees a write from a background isolate', () async {
    final (db, dbConnection, _) = await openDb();
    final initialRows = await db.select(db.storeEntity).get();
    expect(initialRows, isEmpty);

    addTearDown(() async {
      await db.close();
      await dbConnection.close();
    });

    final rowCounts = db.select(db.storeEntity).watch().map((rows) => rows.length);
    final emissionFuture = expectLater(rowCounts, emitsThrough(1));

    await compute(_writerTask, path);
    await emissionFuture;
  });
}

Future<void> _writerTask(String path) async {
  final (db, dbConnection, sqlitePool) = await _openDb(path);

  try {
    await db.into(db.storeEntity).insert(const StoreEntityCompanion(id: Value(1), intValue: Value(42)));
  } finally {
    await db.close();
    await dbConnection.close();
    sqlitePool.close();
  }
}

Future<(Drift, SqliteDatabase, SqliteConnectionPool)> _openDb(String path) async {
  final sqliteDb = SqliteDatabase.withFactory(ImmichSqliteOpenFactory(path: path));
  await sqliteDb.initialize();
  final pool = SqliteConnectionPool.open(
    name: path,
    openConnections: () => throw StateError('pool should already be open'),
  );
  return (Drift.sqlite(sqliteDb, pool), sqliteDb, pool);
}
