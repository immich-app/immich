import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/domain/services/troubleshoot.service.dart';
import 'package:mocktail/mocktail.dart';
import 'package:path/path.dart' as p;

import '../infrastructure/repository.mock.dart';

void main() {
  group('TroubleshootService', () {
    late LogService logService;
    late Directory dir;
    late TroubleshootService sut;

    setUp(() async {
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
      sut = TroubleshootService(logService);
    });

    tearDown(() async {
      await logService.dispose();
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

      for (final key in SettingsKey.values.where((key) => key.sensitive)) {
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

    test('bundle contains all selected items as separate files', () async {
      final progress = <double>[];
      final parts = await sut.buildBundle(
        dir,
        config: const AppConfig(),
        includeLogs: true,
        includeConfig: true,
        onProgress: progress.add,
      );

      expect(parts.map((f) => p.basename(f.path)), ['immich.log', 'app_config.json']);
      expect(progress, [0.5, 1.0]);

      final json = jsonDecode(await parts.last.readAsString()) as Map<String, dynamic>;
      expect(json['themeMode'], 'system');
      expect(json.containsKey('networkLocalEndpoint'), isFalse);
    });

    test('bundle skips deselected items', () async {
      final progress = <double>[];
      final parts = await sut.buildBundle(
        dir,
        config: const AppConfig(),
        includeLogs: true,
        includeConfig: false,
        onProgress: progress.add,
      );

      expect(parts.map((f) => p.basename(f.path)), ['immich.log']);
      expect(progress, [1.0]);
    });
  });
}
