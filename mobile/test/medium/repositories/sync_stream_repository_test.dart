import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_stream.repository.dart';

import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late SyncStreamRepository sut;

  setUp(() {
    ctx = MediumRepositoryContext();
    sut = SyncStreamRepository(ctx.db);
  });

  tearDown(() async {
    await ctx.dispose();
  });

  group('pruneAssets', () {
    test('deletes foreign orphans and keeps owned, partner, and in-album assets', () async {
      final me = await ctx.newUser();
      final partner = await ctx.newUser();
      final stranger = await ctx.newUser();
      await ctx.newAuthUser(id: me.id);
      await ctx.newPartner(sharedById: partner.id, sharedWithId: me.id);

      final own = await ctx.newRemoteAsset(ownerId: me.id);
      final fromPartner = await ctx.newRemoteAsset(ownerId: partner.id);
      final shared = await ctx.newRemoteAsset(ownerId: stranger.id);
      await ctx.newRemoteAsset(ownerId: stranger.id);

      final album = await ctx.newRemoteAlbum(ownerId: me.id);
      await ctx.newRemoteAlbumAsset(albumId: album.id, assetId: shared.id);

      await sut.pruneAssets();

      final remaining = await ctx.db.select(ctx.db.remoteAssetEntity).get();
      expect(remaining.map((a) => a.id), unorderedEquals([own.id, fromPartner.id, shared.id]));
    });

    test('does nothing when there is no authenticated user', () async {
      final stranger = await ctx.newUser();
      final orphan = await ctx.newRemoteAsset(ownerId: stranger.id);

      await sut.pruneAssets();

      final remaining = await ctx.db.select(ctx.db.remoteAssetEntity).get();
      expect(remaining.map((a) => a.id), [orphan.id]);
    });

    test('prunes every stale foreign asset in a large data set', () async {
      final stranger = await ctx.newUser();
      await ctx.newAuthUser();
      for (var i = 0; i < 600; i++) {
        await ctx.newRemoteAsset(ownerId: stranger.id);
      }

      await sut.pruneAssets();

      final remaining = await ctx.db.select(ctx.db.remoteAssetEntity).get();
      expect(remaining, isEmpty);
    });
  });
}
