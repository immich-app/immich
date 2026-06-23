import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/utils/option.dart';

import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late DriftLocalAlbumRepository sut;

  setUp(() {
    ctx = MediumRepositoryContext();
    sut = DriftLocalAlbumRepository(ctx.db);
  });

  tearDown(() async {
    await ctx.dispose();
  });

  group('getAssetsToHash', () {
    test('returns unhashed assets in the album', () async {
      final album = await ctx.newLocalAlbum();
      final a = await ctx.newLocalAsset(checksumOption: const Option.none());
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: a.id);

      final result = await sut.getAssetsToHash(album.id);
      expect(result.map((e) => e.id), [a.id]);
    });

    test('skips assets that already have a checksum', () async {
      final album = await ctx.newLocalAlbum();
      final hashed = await ctx.newLocalAsset(checksum: 'abc');
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: hashed.id);

      expect(await sut.getAssetsToHash(album.id), isEmpty);
    });

    test('hashes burst members whose representative is in the album (members not album-tied)', () async {
      // iOS only puts the burst cover in a user album; the hidden members must
      // still be hashed so they can become backup candidates.
      final album = await ctx.newLocalAlbum();
      final rep = await ctx.newLocalAsset(
        checksumOption: const Option.none(),
        burstId: 'b1',
        isBurstRepresentative: true,
      );
      final member = await ctx.newLocalAsset(
        checksumOption: const Option.none(),
        burstId: 'b1',
        isBurstRepresentative: false,
      );
      // only the representative is an album member
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: rep.id);

      final result = await sut.getAssetsToHash(album.id);
      expect(result.map((e) => e.id).toSet(), {rep.id, member.id});
    });

    test('does not hash burst members of a representative in a different album', () async {
      final album = await ctx.newLocalAlbum();
      final otherAlbum = await ctx.newLocalAlbum();
      final rep = await ctx.newLocalAsset(
        checksumOption: const Option.none(),
        burstId: 'b1',
        isBurstRepresentative: true,
      );
      await ctx.newLocalAsset(checksumOption: const Option.none(), burstId: 'b1', isBurstRepresentative: false);
      // rep is in otherAlbum, not the album we query
      await ctx.newLocalAlbumAsset(albumId: otherAlbum.id, assetId: rep.id);

      expect(await sut.getAssetsToHash(album.id), isEmpty);
    });
  });
}
