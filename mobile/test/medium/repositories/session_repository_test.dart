import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/session.model.dart';
import 'package:immich_mobile/infrastructure/entities/session.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/session.repository.dart';

import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late SessionRepository sut;

  setUpAll(() async {
    ctx = MediumRepositoryContext();
    sut = await SessionRepository.ensureInitialized(ctx.db);
  });

  tearDownAll(() async {
    await ctx.dispose();
  });

  setUp(() async {
    await ctx.db.delete(ctx.db.sessionEntity).go();
    await SessionRepository.instance.refresh();
  });

  group('defaults', () {
    test('session returns null fields when DB is empty', () {
      expect(sut.session.serverUrl, isNull);
      expect(sut.session.accessToken, isNull);
      expect(sut.session.serverEndpoint, isNull);
    });
  });

  group('write', () {
    test('persists a value and reflects it in the composed view', () async {
      await sut.write(.serverEndpoint, 'https://demo.immich.app/api');
      expect(sut.session.serverEndpoint, 'https://demo.immich.app/api');
    });

    test('persists across keys independently', () async {
      await sut.write(.serverUrl, 'https://demo.immich.app');
      await sut.write(.accessToken, 'token-123');
      expect(sut.session.serverUrl, 'https://demo.immich.app');
      expect(sut.session.accessToken, 'token-123');
      expect(sut.session.serverEndpoint, isNull);
    });
  });

  group('null values', () {
    test('a stored NULL value column decodes to null on refresh', () async {
      await ctx.db
          .into(ctx.db.sessionEntity)
          .insert(
            SessionEntityCompanion.insert(
              key: SessionKey.accessToken.name,
              value: const .new(null),
              updatedAt: .new(DateTime.now()),
            ),
          );

      await SessionRepository.instance.refresh();
      expect(sut.session.accessToken, isNull);
    });
  });

  group('sync', () {
    test('picks up rows that were inserted directly into the DB', () async {
      await ctx.db
          .into(ctx.db.sessionEntity)
          .insert(
            SessionEntityCompanion.insert(
              key: SessionKey.serverEndpoint.name,
              value: const .new('https://demo.immich.app/api'),
              updatedAt: .new(DateTime.now()),
            ),
          );
      expect(sut.session.serverEndpoint, isNull);

      await SessionRepository.instance.refresh();
      expect(sut.session.serverEndpoint, 'https://demo.immich.app/api');
    });

    test('drops cached values for rows that were deleted out from under the repo', () async {
      await sut.write(.serverEndpoint, 'https://demo.immich.app/api');
      await ctx.db.delete(ctx.db.sessionEntity).go();
      expect(sut.session.serverEndpoint, 'https://demo.immich.app/api');

      await SessionRepository.instance.refresh();
      expect(sut.session.serverEndpoint, isNull);
    });

    test('skips rows whose key is unknown to SessionKey', () async {
      await ctx.db
          .into(ctx.db.sessionEntity)
          .insert(
            SessionEntityCompanion.insert(
              key: 'session.unknown.future-key',
              value: const .new('unknown'),
              updatedAt: .new(DateTime.now()),
            ),
          );

      await SessionRepository.instance.refresh();
      expect(sut.session.serverEndpoint, isNull);
    });
  });

  group('watch', () {
    test('watchSession emits the new value after a write', () async {
      final expectation = expectLater(
        sut.watch().map((s) => s.serverEndpoint),
        emitsThrough('https://demo.immich.app/api/watch'),
      );
      await sut.write(SessionKey.serverEndpoint, 'https://demo.immich.app/api/watch');
      await expectation;
    });
  });
}
