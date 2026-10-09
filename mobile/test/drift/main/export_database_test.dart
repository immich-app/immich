import 'dart:convert';
import 'dart:io';

import 'package:drift_dev/api/migrations_native.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user_metadata.model.dart';
import 'package:sqlite3/sqlite3.dart';

import 'generated/schema.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Directory dir;

  setUp(() async {
    dir = await Directory.systemTemp.createTemp('immich_export_test');
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
      const MethodChannel('plugins.flutter.io/path_provider'),
      (_) async => dir.path,
    );
  });

  tearDown(() => dir.delete(recursive: true));

  Future<Database> openApp({int? version}) async {
    final schema = await SchemaVerifier(GeneratedHelper()).schemaAt(version ?? GeneratedHelper.versions.last);
    schema.rawDatabase.execute('VACUUM INTO ?', ['${dir.path}/immich.sqlite']);
    return sqlite3.open('${dir.path}/immich.sqlite');
  }

  Database openLogs(List<String> messages) {
    final logs = sqlite3.open('${dir.path}/immich_logs.sqlite')
      ..execute(
        'CREATE TABLE logger_messages (id INTEGER PRIMARY KEY, message TEXT NOT NULL, details TEXT, stack TEXT)',
      );
    for (final message in messages) {
      logs.execute('INSERT INTO logger_messages (message) VALUES (?)', [message]);
    }
    return logs;
  }

  test('the export has no login, pin, license, server address or headers', () async {
    // the app keeps its connection open, so the rows are still in the WAL when the export runs
    final app = (await openApp())..execute('PRAGMA journal_mode = WAL');
    addTearDown(app.close);
    app
      // id 15 held a client certificate before the key was removed from StoreKey
      ..execute('INSERT INTO store_entity (id, string_value) VALUES (?, ?), (?, ?), (?, ?), (?, ?)', [
        StoreKey.accessToken.id,
        'secret-ABC123',
        StoreKey.serverUrl.id,
        'https://Secret-Host.example',
        StoreKey.syncMigrationStatus.id,
        'status',
        15,
        'secret-certificate',
      ])
      ..execute('INSERT INTO settings (key, value) VALUES (?, ?)', ['removedSetting', 'secret-removed'])
      ..execute('INSERT INTO auth_user_entity (id, name, email, avatar_color, pin_code) VALUES (?, ?, ?, ?, ?)', [
        'user',
        'name',
        'email',
        0,
        'secret-pin',
      ])
      ..execute('INSERT INTO user_metadata_entity VALUES (?, ?, ?), (?, ?, ?)', [
        'user',
        UserMetadataKey.license.index,
        utf8.encode('secret-license'),
        'user',
        UserMetadataKey.preferences.index,
        utf8.encode('preferences'),
      ]);
    for (final key in SettingsKey.values) {
      app.execute('INSERT INTO settings (key, value) VALUES (?, ?)', [
        key.name,
        key.sensitive ? 'secret-${key.name}' : 'x',
      ]);
    }
    app
      ..execute('UPDATE settings SET value = ? WHERE key = ?', [
        '{"X-Api-Key":"secret-header-value","X-Debug":"1"}',
        SettingsKey.networkCustomHeaders.name,
      ])
      ..execute('UPDATE settings SET value = ? WHERE key = ?', ['[]', SettingsKey.networkExternalEndpointList.name])
      ..execute('UPDATE settings SET value = ? WHERE key = ?', ['', SettingsKey.networkPreferredWifiName.name]);
    openLogs([
        // older lines print tokens and addresses the store no longer holds
        'Failed to update auth info with access token: secret-old-token',
        'Using server URL: https://secret-old.example/api',
        'SocketException: Connection refused, address = secret-old.example, port = 2283',
        'Received OAuth callback: app.immich:/oauth-callback?code=secret-code',
        'store write failed with secret-ABC123',
        'sent secret-header-value',
        'ping Secret-Host.example',
        'Cloud IDs to sync: []',
        'Uploaded 12 assets',
        'Sync failed: SqliteException(11): malformed, parameters: secret-old-param',
      ])
      ..execute('INSERT INTO logger_messages (message, details) VALUES (?, ?), (?, ?)', [
        'Failed establishing connection to the server',
        "SocketException: Failed host lookup: 'secret-old.example'",
        'Error: SyncAuthUserV1',
        'SqliteException(1555): constraint failed, parameters: user, secret-old-pin',
      ])
      ..close();

    // a second export replaces the first one
    await exportSqliteDatabase();
    final [report, export, logs] = await exportSqliteDatabase();

    expect(await report.readAsString(), 'user_version ${GeneratedHelper.versions.last}\nok');
    expect(String.fromCharCodes(await export.readAsBytes()), isNot(contains('secret')));
    expect(String.fromCharCodes(await logs.readAsBytes()), isNot(contains('secret')));
    final db = sqlite3.open(export.path);
    addTearDown(db.close);
    expect(db.select('SELECT string_value FROM store_entity').map((row) => row['string_value']), ['status']);
    expect(
      db.select('SELECT key FROM settings').map((row) => row['key']),
      unorderedEquals([
        for (final key in SettingsKey.values)
          if (!key.sensitive) key.name,
      ]),
    );
    expect(db.select('SELECT pin_code FROM auth_user_entity').map((row) => row['pin_code']), [null]);
    expect(db.select('SELECT key FROM user_metadata_entity').map((row) => row['key']), [
      UserMetadataKey.preferences.index,
    ]);
    final logDb = sqlite3.open(logs.path);
    addTearDown(logDb.close);
    expect(logDb.select('SELECT message, details FROM logger_messages').map((row) => row.values), [
      ['Cloud IDs to sync: []', null],
      ['Uploaded 12 assets', null],
      ['Sync failed: SqliteException(11): malformed', null],
      ['Error: SyncAuthUserV1', 'SqliteException(1555): constraint failed'],
    ]);
  });

  test('a v2.7 database without the settings table still exports clean', () async {
    (await openApp(version: 22))
      ..execute('INSERT INTO store_entity (id, string_value) VALUES (?, ?), (?, ?), (?, ?)', [
        StoreKey.accessToken.id,
        'secret-ABC123',
        StoreKey.legacyCustomHeaders.id,
        '{"X-Api-Key":"secret-header-value"}',
        StoreKey.legacyExternalEndpointList.id,
        '[{"url":"https://secret-ext.example","status":"valid"}]',
      ])
      ..close();
    openLogs(['sent secret-header-value', 'ping secret-ext.example', 'Sync finished']).close();

    final [_, export, logs] = await exportSqliteDatabase();

    expect(String.fromCharCodes(await export.readAsBytes()), isNot(contains('secret')));
    expect(String.fromCharCodes(await logs.readAsBytes()), isNot(contains('secret')));
  });

  test('a damaged database still exports where the damage is and the cleaned logs', () async {
    final app = (await openApp())
      ..execute('INSERT INTO store_entity (id, string_value) VALUES (?, ?)', [
        StoreKey.accessToken.id,
        'secret-ABC123',
      ]);
    final page =
        app.select("SELECT rootpage FROM sqlite_master WHERE name = 'remote_asset_entity'").single['rootpage'] as int;
    app.close();
    // garbage over the asset table's page
    final file = File('${dir.path}/immich.sqlite');
    file.writeAsBytesSync(file.readAsBytesSync()..fillRange((page - 1) * 4096, page * 4096, 0x5a));
    openLogs(['store write failed with secret-ABC123', 'Sync finished']).close();

    final [report, logs] = await exportSqliteDatabase();

    expect(await report.readAsString(), contains('page $page'));
    expect(String.fromCharCodes(await logs.readAsBytes()), isNot(contains('secret')));
    expect(File('${dir.path}/immich_export.sqlite-raw').existsSync(), isFalse);
  });

  test('a failing step never writes a hidden value into the report', () async {
    (await openApp())
      ..execute('INSERT INTO store_entity (id, string_value) VALUES (?, ?)', [StoreKey.accessToken.id, 'secret-ABC123'])
      ..close();
    // the log cleanup fails after it bound the hidden values
    openLogs(['store write failed with secret-ABC123'])
      ..execute("CREATE TRIGGER fail BEFORE DELETE ON logger_messages BEGIN SELECT RAISE(ABORT, 'cleanup failed'); END")
      ..close();

    final [report, _] = await exportSqliteDatabase();

    expect(await report.readAsString(), allOf(contains('cleanup failed'), isNot(contains('secret'))));
  });

  test('without a readable database only the report is exported', () async {
    openLogs(['sent secret-header-value']).close();

    final [_] = await exportSqliteDatabase();
    expect(File('${dir.path}/immich.sqlite').existsSync(), isFalse);

    await File('${dir.path}/immich.sqlite').writeAsString('not a database');
    final [report] = await exportSqliteDatabase();
    expect(await report.readAsString(), contains('file is not a database'));
  });
}
