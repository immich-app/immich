import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/data/db/logger/database.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/infrastructure/repositories/log.repository.dart';
import 'package:immich_mobile/services/immich_logger.service.dart';

void main() {
  testWidgets('Shares the startup error and the stored logs cleaned before the log service starts', (tester) async {
    final dir = Directory.systemTemp.createTempSync('immich-logs');
    addTearDown(() => dir.delete(recursive: true));
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
      const MethodChannel('plugins.flutter.io/path_provider'),
      (_) async => dir.path,
    );
    late String shared;
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
      const MethodChannel('dev.fluttercommunity.plus/share'),
      (call) async {
        shared = File(((call.arguments as Map)['paths'] as List).single as String).readAsStringSync();
        return 'success';
      },
    );
    await tester.pumpWidget(const SizedBox());

    await tester.runAsync(() async {
      final logs = DriftLogger.sqlite(await openSqliteConnection(name: 'immich_logs'));
      await LogRepository(logs).insertAll([
        LogMessage(
          message: 'Failed to connect to old.example.net/203.0.113.9:443, uri=https://old.example.net/api',
          level: LogLevel.warning,
          createdAt: DateTime(2026, 10, 15),
        ),
      ]);
      await logs.close();

      await ImmichLogger.shareLogs(
        tester.element(find.byType(SizedBox)),
        startupError: 'SqliteException(2067): UNIQUE constraint failed, parameters: 14, someone@example.com',
      );
    });

    expect(shared, startsWith('SqliteException(2067): UNIQUE constraint failed, parameters: <parameters>\n\n'));
    expect(shared, contains('| Failed to connect to <host>/<ip>:443, uri=https://<host>/api |'));
  });
}
