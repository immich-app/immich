import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';

import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late RemoteAssetRepository sut;

  setUp(() {
    ctx = MediumRepositoryContext();
    sut = RemoteAssetRepository(ctx.db);
  });

  tearDown(() async {
    await ctx.dispose();
  });

  group('getByChecksum', () {
    late String userId;

    setUp(() async {
      final user = await ctx.newUser();
      userId = user.id;
      await ctx.newAuthUser(id: userId);
    });

    test('returns the current user\'s asset when a partner shares the checksum', () async {
      const checksum = 'shared-partner-checksum';
      final mine = await ctx.newRemoteAsset(ownerId: userId, checksum: checksum);
      final partner = await ctx.newUser();
      await ctx.newRemoteAsset(ownerId: partner.id, checksum: checksum);

      final result = await sut.getByChecksum(checksum);

      expect(result, isNotNull);
      expect(result!.id, mine.id);
      expect(result.ownerId, userId);
    });

    test('returns null when current user does not own the checksum, but a partner does', () async {
      const checksum = 'partner-only';
      final partner = await ctx.newUser();
      await ctx.newRemoteAsset(ownerId: partner.id, checksum: checksum);

      final result = await sut.getByChecksum(checksum);

      expect(result, isNull);
    });

    test('returns the current user\'s asset', () async {
      const checksum = 'simple';
      final remote = await ctx.newRemoteAsset(ownerId: userId, checksum: checksum);

      final result = await sut.getByChecksum(checksum);

      expect(result, isNotNull);
      expect(result!.id, remote.id);
    });
  });
}
