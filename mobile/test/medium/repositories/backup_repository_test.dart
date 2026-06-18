import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/infrastructure/repositories/backup.repository.dart';
import 'package:immich_mobile/utils/option.dart';

import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late DriftBackupRepository sut;

  setUp(() {
    ctx = MediumRepositoryContext();
    sut = DriftBackupRepository(ctx.db);
  });

  tearDown(() async {
    await ctx.dispose();
  });

  group('getAllCounts', () {
    late String userId;

    setUp(() async {
      final user = await ctx.newUser();
      userId = user.id;
    });

    test('returns zeros when no albums exist', () async {
      final result = await sut.getAllCounts(userId);
      expect(result.total, 0);
      expect(result.remainder, 0);
      expect(result.processing, 0);
    });

    test('returns zeros when no selected albums exist', () async {
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.none);
      final asset = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: asset.id);

      final result = await sut.getAllCounts(userId);
      expect(result.total, 0);
      expect(result.remainder, 0);
      expect(result.processing, 0);
    });

    test('counts asset in selected album as total and remainder', () async {
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final asset = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: asset.id);

      final result = await sut.getAllCounts(userId);
      expect(result.total, 1);
      expect(result.remainder, 1);
      expect(result.processing, 0);
    });

    test('backed up asset reduces remainder', () async {
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final remote = await ctx.newRemoteAsset(ownerId: userId);
      final local = await ctx.newLocalAsset(checksum: remote.checksum);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: local.id);

      final result = await sut.getAllCounts(userId);
      expect(result.total, 1);
      expect(result.remainder, 0);
      expect(result.processing, 0);
    });

    test('asset with null checksum is counted as processing', () async {
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final asset = await ctx.newLocalAsset(checksumOption: const Option.none());
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: asset.id);

      final result = await sut.getAllCounts(userId);
      expect(result.total, 1);
      expect(result.remainder, 1);
      expect(result.processing, 1);
    });

    test('asset in excluded album is not counted even if also in selected album', () async {
      final selectedAlbum = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final excludedAlbum = await ctx.newLocalAlbum(backupSelection: BackupSelection.excluded);
      final asset = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: selectedAlbum.id, assetId: asset.id);
      await ctx.newLocalAlbumAsset(albumId: excludedAlbum.id, assetId: asset.id);

      final result = await sut.getAllCounts(userId);
      expect(result.total, 0);
      expect(result.remainder, 0);
    });

    test('counts assets across multiple selected albums without duplicates', () async {
      final album1 = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final album2 = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final asset = await ctx.newLocalAsset();
      // Same asset in two selected albums
      await ctx.newLocalAlbumAsset(albumId: album1.id, assetId: asset.id);
      await ctx.newLocalAlbumAsset(albumId: album2.id, assetId: asset.id);

      final result = await sut.getAllCounts(userId);
      expect(result.total, 1);
    });

    test('backed up asset for different user is still counted as remainder', () async {
      final otherUser = await ctx.newUser();
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final remote = await ctx.newRemoteAsset(ownerId: otherUser.id);
      final local = await ctx.newLocalAsset(checksum: remote.checksum);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: local.id);

      final result = await sut.getAllCounts(userId);
      expect(result.total, 1);
      expect(result.remainder, 1);
    });

    test('mixed assets produce correct combined counts', () async {
      final selectedAlbum = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);

      // backed up
      final remote1 = await ctx.newRemoteAsset(ownerId: userId);
      final local1 = await ctx.newLocalAsset(checksum: remote1.checksum);
      await ctx.newLocalAlbumAsset(albumId: selectedAlbum.id, assetId: local1.id);

      // not backed up, has checksum
      final local2 = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: selectedAlbum.id, assetId: local2.id);

      // processing (null checksum)
      final local3 = await ctx.newLocalAsset(checksumOption: const Option.none());
      await ctx.newLocalAlbumAsset(albumId: selectedAlbum.id, assetId: local3.id);

      final result = await sut.getAllCounts(userId);
      expect(result.total, 3);
      expect(result.remainder, 2); // local2 + local3
      expect(result.processing, 1); // local3
    });

    test('reconciled asset with live prior remote counts in total but not remainder', () async {
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      // uploaded as edit pair: prior remote is live, but no remote row matches the local checksum
      final prior = await ctx.newRemoteAsset(ownerId: userId);
      final local = await ctx.newLocalAsset(checksum: 'edited-1', syncedChecksum: 'edited-1', priorRemoteId: prior.id);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: local.id);

      final result = await sut.getAllCounts(userId);
      expect(result.total, 1);
      expect(result.remainder, 0);
      expect(result.processing, 0);
    });

    test('reverted-handled asset counts in total but not remainder', () async {
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      // revert handled: local re-hashed fresh, stamped synced + prior pointing at the base remote
      final prior = await ctx.newRemoteAsset(ownerId: userId);
      final local = await ctx.newLocalAsset(
        checksum: 'reverted-1',
        syncedChecksum: 'reverted-1',
        priorRemoteId: prior.id,
      );
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: local.id);

      final result = await sut.getAllCounts(userId);
      expect(result.total, 1);
      expect(result.remainder, 0);
    });

    test('reconciled asset with trashed prior remote stays out of remainder', () async {
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      // prior was trashed, not hard-deleted: the row still exists, so the revert
      // stays handled — only a missing row re-opens the asset
      final prior = await ctx.newRemoteAsset(ownerId: userId, deletedAt: DateTime(2025, 6));
      final local = await ctx.newLocalAsset(checksum: 'edited-3', syncedChecksum: 'edited-3', priorRemoteId: prior.id);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: local.id);

      final result = await sut.getAllCounts(userId);
      expect(result.total, 1);
      expect(result.remainder, 0);
    });

    test('reconciled asset with hard-deleted prior remote counts in remainder', () async {
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      // prior remote row is gone -> needs re-upload
      final local = await ctx.newLocalAsset(checksum: 'edited-2', syncedChecksum: 'edited-2', priorRemoteId: 'gone');
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: local.id);

      final result = await sut.getAllCounts(userId);
      expect(result.total, 1);
      expect(result.remainder, 1);
    });

    test('burst members inherit their representative\'s selected album in the counts', () async {
      // getAllCounts drives the UI count + the foreground loop early-exit, so it
      // must agree with getCandidates: hidden members count when the cover's
      // album is selected, even though only the cover is album-tied.
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final rep = await ctx.newLocalAsset(burstId: 'b1', isBurstRepresentative: true);
      await ctx.newLocalAsset(burstId: 'b1', isBurstRepresentative: false);
      await ctx.newLocalAsset(burstId: 'b1', isBurstRepresentative: false);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: rep.id);

      final result = await sut.getAllCounts(userId);
      expect(result.total, 3);
      expect(result.remainder, 3);
      expect(result.processing, 0);
    });

    test('burst members are not counted when their representative album is not selected', () async {
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.none);
      final rep = await ctx.newLocalAsset(burstId: 'b1', isBurstRepresentative: true);
      await ctx.newLocalAsset(burstId: 'b1', isBurstRepresentative: false);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: rep.id);

      final result = await sut.getAllCounts(userId);
      expect(result.total, 0);
      expect(result.remainder, 0);
    });

    test('burst members are not counted when the rep is in both a selected and an excluded album', () async {
      // exclude-wins must propagate to the hidden members: the rep is suppressed,
      // so its members must not leak into the counts either.
      final selected = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final excluded = await ctx.newLocalAlbum(backupSelection: BackupSelection.excluded);
      final rep = await ctx.newLocalAsset(burstId: 'b1', isBurstRepresentative: true);
      await ctx.newLocalAsset(burstId: 'b1', isBurstRepresentative: false);
      await ctx.newLocalAlbumAsset(albumId: selected.id, assetId: rep.id);
      await ctx.newLocalAlbumAsset(albumId: excluded.id, assetId: rep.id);

      final result = await sut.getAllCounts(userId);
      expect(result.total, 0);
      expect(result.remainder, 0);
    });
  });

  group('getCandidates', () {
    late String userId;

    setUp(() async {
      final user = await ctx.newUser();
      userId = user.id;
    });

    test('returns empty list when no selected albums exist', () async {
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.none);
      final asset = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: asset.id);

      final result = await sut.getCandidates(userId);
      expect(result, isEmpty);
    });

    test('returns asset in selected album that is not backed up', () async {
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final asset = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: asset.id);

      final result = await sut.getCandidates(userId);
      expect(result.length, 1);
      expect(result.first.id, asset.id);
    });

    test('burst member inherits candidacy from its representative in a selected album', () async {
      // iOS adds only the burst cover to a user album; the hidden members live in
      // the smart album. They must still back up when the cover's album is selected.
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final rep = await ctx.newLocalAsset(burstId: 'b1', isBurstRepresentative: true);
      final member1 = await ctx.newLocalAsset(burstId: 'b1', isBurstRepresentative: false);
      final member2 = await ctx.newLocalAsset(burstId: 'b1', isBurstRepresentative: false);
      // only the representative is an album member
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: rep.id);

      final result = await sut.getCandidates(userId);
      expect(result.map((a) => a.id).toSet(), {rep.id, member1.id, member2.id});
    });

    test('burst member is NOT a candidate when its representative album is not selected', () async {
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.none);
      final rep = await ctx.newLocalAsset(burstId: 'b1', isBurstRepresentative: true);
      await ctx.newLocalAsset(burstId: 'b1', isBurstRepresentative: false);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: rep.id);

      expect(await sut.getCandidates(userId), isEmpty);
    });

    test('burstId filter returns only that burst\'s non-representative members', () async {
      // The bg re-enqueue path calls getCandidates(userId, burstId: b) to grab just
      // one burst's gated frames once its anchor lands — not the rep, not other bursts.
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final rep1 = await ctx.newLocalAsset(burstId: 'b1', isBurstRepresentative: true);
      final m1a = await ctx.newLocalAsset(burstId: 'b1', isBurstRepresentative: false);
      final m1b = await ctx.newLocalAsset(burstId: 'b1', isBurstRepresentative: false);
      final rep2 = await ctx.newLocalAsset(burstId: 'b2', isBurstRepresentative: true);
      await ctx.newLocalAsset(burstId: 'b2', isBurstRepresentative: false);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: rep1.id);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: rep2.id);

      final result = await sut.getCandidates(userId, burstId: 'b1');
      expect(result.map((a) => a.id).toSet(), {m1a.id, m1b.id});
    });

    test('burst member is NOT a candidate when the rep is in both a selected and an excluded album', () async {
      // exclude-wins propagates: the rep is held back, so its hidden members must
      // not upload either.
      final selected = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final excluded = await ctx.newLocalAlbum(backupSelection: BackupSelection.excluded);
      final rep = await ctx.newLocalAsset(burstId: 'b1', isBurstRepresentative: true);
      await ctx.newLocalAsset(burstId: 'b1', isBurstRepresentative: false);
      await ctx.newLocalAlbumAsset(albumId: selected.id, assetId: rep.id);
      await ctx.newLocalAlbumAsset(albumId: excluded.id, assetId: rep.id);

      expect(await sut.getCandidates(userId), isEmpty);
    });

    test('excludes asset already backed up for the same user', () async {
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final remote = await ctx.newRemoteAsset(ownerId: userId);
      final local = await ctx.newLocalAsset(checksum: remote.checksum);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: local.id);

      final result = await sut.getCandidates(userId);
      expect(result, isEmpty);
    });

    test('includes asset backed up for a different user', () async {
      final otherUser = await ctx.newUser();
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final remote = await ctx.newRemoteAsset(ownerId: otherUser.id);
      final local = await ctx.newLocalAsset(checksum: remote.checksum);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: local.id);

      final result = await sut.getCandidates(userId);
      expect(result.length, 1);
      expect(result.first.id, local.id);
    });

    test('excludes asset in excluded album even if also in selected album', () async {
      final selectedAlbum = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final excludedAlbum = await ctx.newLocalAlbum(backupSelection: BackupSelection.excluded);
      final asset = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: selectedAlbum.id, assetId: asset.id);
      await ctx.newLocalAlbumAsset(albumId: excludedAlbum.id, assetId: asset.id);

      final result = await sut.getCandidates(userId);
      expect(result, isEmpty);
    });

    test('excludes asset with null checksum when onlyHashed is true', () async {
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final asset = await ctx.newLocalAsset(checksumOption: const Option.none());
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: asset.id);

      final result = await sut.getCandidates(userId);
      expect(result, isEmpty);
    });

    test('includes asset with null checksum when onlyHashed is false', () async {
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final asset = await ctx.newLocalAsset(checksumOption: const Option.none());
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: asset.id);

      final result = await sut.getCandidates(userId, onlyHashed: false);
      expect(result.length, 1);
      expect(result.first.id, asset.id);
    });

    test('returns assets ordered by createdAt descending', () async {
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final asset1 = await ctx.newLocalAsset(createdAt: DateTime(2024, 1, 1));
      final asset2 = await ctx.newLocalAsset(createdAt: DateTime(2024, 3, 1));
      final asset3 = await ctx.newLocalAsset(createdAt: DateTime(2024, 2, 1));
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: asset1.id);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: asset2.id);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: asset3.id);

      final result = await sut.getCandidates(userId);
      expect(result.map((a) => a.id).toList(), [asset2.id, asset3.id, asset1.id]);
    });

    test('does not return duplicate when asset is in multiple selected albums', () async {
      final album1 = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final album2 = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final asset = await ctx.newLocalAsset();
      await ctx.newLocalAlbumAsset(albumId: album1.id, assetId: asset.id);
      await ctx.newLocalAlbumAsset(albumId: album2.id, assetId: asset.id);

      final result = await sut.getCandidates(userId);
      expect(result.length, 1);
      expect(result.first.id, asset.id);
    });

    test('includes re-edited asset whose synced checksum is stale', () async {
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final prior = await ctx.newRemoteAsset(ownerId: userId);
      final local = await ctx.newLocalAsset(checksum: 'edit-v2', syncedChecksum: 'edit-v1', priorRemoteId: prior.id);
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: local.id);

      final result = await sut.getCandidates(userId);
      expect(result.length, 1);
      expect(result.first.id, local.id);
    });

    test('excludes reconciled asset with live prior remote', () async {
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final prior = await ctx.newRemoteAsset(ownerId: userId);
      final local = await ctx.newLocalAsset(
        checksum: 'reverted-2',
        syncedChecksum: 'reverted-2',
        priorRemoteId: prior.id,
      );
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: local.id);

      final result = await sut.getCandidates(userId);
      expect(result, isEmpty);
    });

    test('excludes reconciled asset whose prior remote was trashed', () async {
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final prior = await ctx.newRemoteAsset(ownerId: userId, deletedAt: DateTime(2025, 6));
      final local = await ctx.newLocalAsset(
        checksum: 'reverted-3',
        syncedChecksum: 'reverted-3',
        priorRemoteId: prior.id,
      );
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: local.id);

      final result = await sut.getCandidates(userId);
      expect(result, isEmpty);
    });

    test('includes reconciled asset whose prior remote was hard-deleted', () async {
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final local = await ctx.newLocalAsset(checksum: 'edit-v3', syncedChecksum: 'edit-v3', priorRemoteId: 'gone');
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: local.id);

      final result = await sut.getCandidates(userId);
      expect(result.length, 1);
      expect(result.first.id, local.id);
    });

    test('includes asset with null checksum and synced checksum set when onlyHashed is false', () async {
      final album = await ctx.newLocalAlbum(backupSelection: BackupSelection.selected);
      final asset = await ctx.newLocalAsset(checksumOption: const Option.none(), syncedChecksum: 'old');
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: asset.id);

      final result = await sut.getCandidates(userId, onlyHashed: false);
      expect(result.length, 1);
      expect(result.first.id, asset.id);
    });
  });
}
