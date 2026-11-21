import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/data/db/logger/database.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/infrastructure/repositories/log.repository.dart';

void main() {
  late DriftLogger db;
  late LogRepository sut;

  setUp(() async {
    db = DriftLogger.fromExecutor(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    sut = LogRepository(db);
    for (final minute in [3, 1, 5, 2, 4]) {
      await sut.insert(LogMessage(message: '$minute', level: .info, createdAt: DateTime(2026, 1, 1, 0, minute)));
    }
  });

  tearDown(() async {
    await db.close();
  });

  test('truncate deletes only the oldest logs', () async {
    await sut.truncate(limit: 3, threshold: 4);

    final logs = await sut.getAll();
    expect(logs.map((log) => log.message), ['5', '4', '3']);
  });

  test('truncate keeps every log until the threshold', () async {
    await sut.truncate(limit: 3, threshold: 5);

    final logs = await sut.getAll();
    expect(logs.map((log) => log.message), ['5', '4', '3', '2', '1']);
  });
}
