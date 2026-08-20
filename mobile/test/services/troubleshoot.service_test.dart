import 'dart:convert';
import 'dart:io';

import 'package:archive/archive_io.dart';
import 'package:drift/drift.dart' hide isNull;
import 'package:drift/native.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/services/troubleshoot.service.dart';
import 'package:mocktail/mocktail.dart';

import '../infrastructure/repository.mock.dart';

void main() {
  late Drift db;
  late LogService logService;
  late Directory dir;
  late TroubleshootService sut;

  setUp(() async {
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    final logRepository = MockLogRepository();
    when(() => logRepository.truncate(limit: any(named: 'limit'))).thenAnswer((_) async {});
    when(() => logRepository.getAll()).thenAnswer((_) async => []);
    final settingsRepository = MockSettingsRepository();
    when(() => settingsRepository.appConfig).thenReturn(const AppConfig());
    logService = await LogService.create(
      logRepository: logRepository,
      settingsRepository: settingsRepository,
      shouldBuffer: false,
    );
    dir = await Directory.systemTemp.createTemp('troubleshoot_test');
    sut = TroubleshootService(db, logService);
  });

  tearDown(() async {
    await logService.dispose();
    await db.close();
    await dir.delete(recursive: true);
  });

  test('configJson drops keys that identify the user or the server', () {
    final config = const AppConfig()
        .write(SettingsKey.networkLocalEndpoint, 'http://192.168.1.5:2283/api')
        .write(SettingsKey.networkExternalEndpointList, ['https://photos.example.com/api'])
        .write(SettingsKey.networkCustomHeaders, {'x-api-key': 'supersecret'})
        .write(SettingsKey.networkPreferredWifiName, 'home-wifi')
        .write(SettingsKey.themeMode, ThemeMode.dark);

    final json = TroubleshootService.configJson(config);

    for (final key in TroubleshootService.excludedConfigKeys) {
      expect(json.containsKey(key.name), isFalse);
    }
    final encoded = jsonEncode(json);
    expect(encoded, isNot(contains('192.168.1.5')));
    expect(encoded, isNot(contains('photos.example.com')));
    expect(encoded, isNot(contains('supersecret')));
    expect(encoded, isNot(contains('home-wifi')));
    expect(json['themeMode'], 'dark');
    expect(json.containsKey('mapCustomFrom'), isTrue);
    expect(json['mapCustomFrom'], isNull);
  });

  test('bundle contains all selected items', () async {
    final zip = await sut.buildBundle(
      dir,
      config: const AppConfig(),
      includeLogs: true,
      includeDatabase: true,
      includeConfig: true,
    );

    final archive = ZipDecoder().decodeBytes(await zip.readAsBytes());
    expect(archive.map((f) => f.name), unorderedEquals(['immich.log', 'immich.sqlite', 'app_config.json']));

    final configEntry = archive.firstWhere((f) => f.name == 'app_config.json');
    final json = jsonDecode(utf8.decode(configEntry.readBytes()!)) as Map<String, dynamic>;
    expect(json['themeMode'], 'system');
    expect(json.containsKey('networkLocalEndpoint'), isFalse);
  });

  test('bundle skips deselected items and exports a valid sqlite snapshot', () async {
    final zip = await sut.buildBundle(
      dir,
      config: const AppConfig(),
      includeLogs: false,
      includeDatabase: true,
      includeConfig: false,
    );

    final archive = ZipDecoder().decodeBytes(await zip.readAsBytes());
    expect(archive.map((f) => f.name), ['immich.sqlite']);
    final header = archive.first.readBytes()!.take(15).toList();
    expect(String.fromCharCodes(header), 'SQLite format 3');
  });
}
