import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/stack.repository.dart';

import '../repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late DriftStackRepository sut;
  late String userId;

  setUp(() async {
    ctx = MediumRepositoryContext();
    sut = DriftStackRepository(ctx.db);
    final user = await ctx.newUser();
    userId = user.id;
  });

  tearDown(() async {
    await ctx.dispose();
  });

  group('priorState', () {
    test('live for a live remote', () async {
      await ctx.newRemoteAsset(id: 'live', ownerId: userId);
      expect(await sut.priorState('live'), PriorState.live);
    });

    test('trashed for a trashed remote', () async {
      await ctx.newRemoteAsset(id: 'trashed', ownerId: userId, deletedAt: DateTime(2025, 6));
      expect(await sut.priorState('trashed'), PriorState.trashed);
    });

    test('trashed for a locked remote (server refuses to stack onto it)', () async {
      await ctx.newRemoteAsset(id: 'locked', ownerId: userId, visibility: AssetVisibility.locked);
      expect(await sut.priorState('locked'), PriorState.trashed);
    });

    test('missing for a remote that was never synced', () async {
      expect(await sut.priorState('missing'), PriorState.missing);
    });
  });

  group('remoteByChecksum', () {
    test('returns live with the id for a live owned remote', () async {
      await ctx.newRemoteAsset(id: 'remote-1', ownerId: userId, checksum: 'base-sum');

      final dup = await sut.remoteByChecksum('base-sum', userId);

      expect(dup.state, PriorState.live);
      expect(dup.remoteId, 'remote-1');
    });

    test('returns trashed with the id for a trashed owned remote', () async {
      await ctx.newRemoteAsset(id: 'remote-1', ownerId: userId, checksum: 'base-sum', deletedAt: DateTime(2025, 6));

      final dup = await sut.remoteByChecksum('base-sum', userId);

      expect(dup.state, PriorState.trashed);
      expect(dup.remoteId, 'remote-1');
    });

    test('returns trashed with the id for a locked owned remote', () async {
      await ctx.newRemoteAsset(
        id: 'remote-1',
        ownerId: userId,
        checksum: 'base-sum',
        visibility: AssetVisibility.locked,
      );

      final dup = await sut.remoteByChecksum('base-sum', userId);

      expect(dup.state, PriorState.trashed);
      expect(dup.remoteId, 'remote-1');
    });

    test('returns missing when no remote has the bytes', () async {
      await ctx.newRemoteAsset(id: 'remote-1', ownerId: userId, checksum: 'other-sum');

      final dup = await sut.remoteByChecksum('base-sum', userId);

      expect(dup.state, PriorState.missing);
      expect(dup.remoteId, isNull);
    });

    test("ignores another user's remote with the same bytes (owner-scoped)", () async {
      final other = await ctx.newUser();
      await ctx.newRemoteAsset(id: 'theirs', ownerId: other.id, checksum: 'base-sum');

      final dup = await sut.remoteByChecksum('base-sum', userId);

      expect(dup.state, PriorState.missing);
      expect(dup.remoteId, isNull);
    });
  });

  group('findStackIdByRemoteId', () {
    test('returns the stack id for a stacked remote', () async {
      final base = await ctx.newRemoteAsset(id: 'base', ownerId: userId);
      final stack = await ctx.newStack(ownerId: userId, primaryAssetId: base.id);
      await ctx.newRemoteAsset(id: 'edit', ownerId: userId, stackId: stack.id);
      expect(await sut.findStackIdByRemoteId('edit'), stack.id);
    });

    test('returns null for an unstacked remote', () async {
      await ctx.newRemoteAsset(id: 'lonely', ownerId: userId);
      expect(await sut.findStackIdByRemoteId('lonely'), isNull);
    });

    test('returns null for a trashed remote', () async {
      final base = await ctx.newRemoteAsset(id: 'base', ownerId: userId);
      final stack = await ctx.newStack(ownerId: userId, primaryAssetId: base.id);
      await ctx.newRemoteAsset(id: 'edit', ownerId: userId, stackId: stack.id, deletedAt: DateTime(2025, 6));
      expect(await sut.findStackIdByRemoteId('edit'), isNull);
    });
  });

  group('findStackBaseId', () {
    test('returns the earliest-uploaded member that is not the excluded one', () async {
      await ctx.newStack(id: 'stack-1', ownerId: userId, primaryAssetId: 'edit');
      await ctx.newRemoteAsset(id: 'base', ownerId: userId, stackId: 'stack-1', uploadedAt: DateTime(2025));
      await ctx.newRemoteAsset(id: 'edit', ownerId: userId, stackId: 'stack-1', uploadedAt: DateTime(2025, 2));

      // base uploaded before the edit → it's the flip target.
      expect(await sut.findStackBaseId('stack-1', excludeId: 'edit'), 'base');
    });

    test('returns null when the only member is excluded', () async {
      final base = await ctx.newRemoteAsset(id: 'solo', ownerId: userId, stackId: 'stack-1');
      await ctx.newStack(id: 'stack-1', ownerId: userId, primaryAssetId: base.id);
      expect(await sut.findStackBaseId('stack-1', excludeId: 'solo'), isNull);
    });

    test('skips trashed members', () async {
      await ctx.newStack(id: 'stack-1', ownerId: userId, primaryAssetId: 'edit');
      await ctx.newRemoteAsset(
        id: 'base',
        ownerId: userId,
        stackId: 'stack-1',
        uploadedAt: DateTime(2025),
        deletedAt: DateTime(2025, 6),
      );
      await ctx.newRemoteAsset(id: 'edit', ownerId: userId, stackId: 'stack-1', uploadedAt: DateTime(2025, 2));
      expect(await sut.findStackBaseId('stack-1', excludeId: 'edit'), isNull);
    });

    test('live shape: unstacked hidden motion videos can never win', () async {
      await ctx.newStack(id: 'stack-1', ownerId: userId, primaryAssetId: 'edit-still');
      await ctx.newRemoteAsset(id: 'base-still', ownerId: userId, stackId: 'stack-1', uploadedAt: DateTime(2025));
      await ctx.newRemoteAsset(id: 'edit-still', ownerId: userId, stackId: 'stack-1', uploadedAt: DateTime(2025, 2));
      // The live pair's motion videos: hidden, no stack, uploaded before everything.
      await ctx.newRemoteAsset(
        id: 'base-video',
        ownerId: userId,
        type: AssetType.video,
        visibility: AssetVisibility.hidden,
        uploadedAt: DateTime(2024),
      );
      await ctx.newRemoteAsset(
        id: 'edit-video',
        ownerId: userId,
        type: AssetType.video,
        visibility: AssetVisibility.hidden,
        uploadedAt: DateTime(2024, 2),
      );

      expect(await sut.findStackBaseId('stack-1', excludeId: 'edit-still'), 'base-still');
    });

    test('oldest member wins even when it is a dedup-reused edit (known limit)', () async {
      await ctx.newStack(id: 'stack-1', ownerId: userId, primaryAssetId: 'prior-edit');
      await ctx.newRemoteAsset(id: 'base', ownerId: userId, stackId: 'stack-1', uploadedAt: DateTime(2025, 2));
      // An edit re-used by server dedup, uploaded before the base ever was.
      await ctx.newRemoteAsset(id: 'dedup-edit', ownerId: userId, stackId: 'stack-1', uploadedAt: DateTime(2025));
      await ctx.newRemoteAsset(id: 'prior-edit', ownerId: userId, stackId: 'stack-1', uploadedAt: DateTime(2025, 3));

      // Heuristic is oldest uploaded_at, so the reused edit beats the real base.
      expect(await sut.findStackBaseId('stack-1', excludeId: 'prior-edit'), 'dedup-edit');
    });

    test('a member with NULL uploaded_at sorts last', () async {
      await ctx.newStack(id: 'stack-1', ownerId: userId, primaryAssetId: 'edit');
      await ctx.newRemoteAsset(id: 'unsynced', ownerId: userId, stackId: 'stack-1');
      await ctx.newRemoteAsset(id: 'base', ownerId: userId, stackId: 'stack-1', uploadedAt: DateTime(2025, 2));
      await ctx.newRemoteAsset(id: 'edit', ownerId: userId, stackId: 'stack-1', uploadedAt: DateTime(2025, 3));

      expect(await sut.findStackBaseId('stack-1', excludeId: 'edit'), 'base');
    });
  });

  group('findRevertReconcileTargets', () {
    test('finds a local that hashed back to a non-primary stack member', () async {
      // Stack: primary = edit, also holds base. The local's checksum matches base.
      await ctx.newStack(id: 'stack-1', ownerId: userId, primaryAssetId: 'edit');
      await ctx.newRemoteAsset(id: 'base', ownerId: userId, stackId: 'stack-1', checksum: 'base-sum');
      await ctx.newRemoteAsset(id: 'edit', ownerId: userId, stackId: 'stack-1', checksum: 'edit-sum');
      await ctx.newLocalAsset(id: 'local-1', checksum: 'base-sum', priorRemoteId: 'edit');

      final targets = await sut.findRevertReconcileTargets();

      expect(targets, hasLength(1));
      expect(targets.first.stackId, 'stack-1');
      expect(targets.first.newPrimaryId, 'base');
      expect(targets.first.localAssetId, 'local-1');
      expect(targets.first.localAssetChecksum, 'base-sum');
    });

    test('stops matching once the primary flips to the matched member', () async {
      await ctx.newStack(id: 'stack-1', ownerId: userId, primaryAssetId: 'edit');
      await ctx.newRemoteAsset(id: 'base', ownerId: userId, stackId: 'stack-1', checksum: 'base-sum');
      await ctx.newRemoteAsset(id: 'edit', ownerId: userId, stackId: 'stack-1', checksum: 'edit-sum');
      await ctx.newLocalAsset(id: 'local-1', checksum: 'base-sum', priorRemoteId: 'edit');

      expect(await sut.findRevertReconcileTargets(), hasLength(1));

      await sut.setPrimary('stack-1', 'base');
      expect(await sut.findRevertReconcileTargets(), isEmpty);
    });

    test('returns nothing when the local already matches the primary', () async {
      await ctx.newStack(id: 'stack-1', ownerId: userId, primaryAssetId: 'edit');
      await ctx.newRemoteAsset(id: 'edit', ownerId: userId, stackId: 'stack-1', checksum: 'edit-sum');
      await ctx.newLocalAsset(id: 'local-1', checksum: 'edit-sum', priorRemoteId: 'edit');

      expect(await sut.findRevertReconcileTargets(), isEmpty);
    });

    test('ignores a local whose prior remote was trashed', () async {
      await ctx.newStack(id: 'stack-1', ownerId: userId, primaryAssetId: 'edit');
      await ctx.newRemoteAsset(id: 'base', ownerId: userId, stackId: 'stack-1', checksum: 'base-sum');
      await ctx.newRemoteAsset(
        id: 'edit',
        ownerId: userId,
        stackId: 'stack-1',
        checksum: 'edit-sum',
        deletedAt: DateTime(2025, 6),
      );
      await ctx.newLocalAsset(id: 'local-1', checksum: 'base-sum', priorRemoteId: 'edit');

      expect(await sut.findRevertReconcileTargets(), isEmpty);
    });

    test('ignores a local whose prior is not in any stack', () async {
      await ctx.newStack(id: 'stack-1', ownerId: userId, primaryAssetId: 'edit');
      await ctx.newRemoteAsset(id: 'base', ownerId: userId, stackId: 'stack-1', checksum: 'base-sum');
      await ctx.newRemoteAsset(id: 'edit', ownerId: userId, stackId: 'stack-1', checksum: 'edit-sum');
      await ctx.newRemoteAsset(id: 'unstacked', ownerId: userId, checksum: 'other-sum');
      await ctx.newLocalAsset(id: 'local-1', checksum: 'base-sum', priorRemoteId: 'unstacked');

      expect(await sut.findRevertReconcileTargets(), isEmpty);
    });

    test('leaves a manual stack of two backed-up locals alone (no ping-pong)', () async {
      // The user stacked two ordinary photos by hand. Each local is steady-state:
      // synced == checksum and prior = its own member, so neither side may ever
      // flip the primary back and forth.
      await ctx.newStack(id: 'stack-1', ownerId: userId, primaryAssetId: 'remote-a');
      await ctx.newRemoteAsset(id: 'remote-a', ownerId: userId, stackId: 'stack-1', checksum: 'a-sum');
      await ctx.newRemoteAsset(id: 'remote-b', ownerId: userId, stackId: 'stack-1', checksum: 'b-sum');
      await ctx.newLocalAsset(id: 'local-a', checksum: 'a-sum', syncedChecksum: 'a-sum', priorRemoteId: 'remote-a');
      await ctx.newLocalAsset(id: 'local-b', checksum: 'b-sum', syncedChecksum: 'b-sum', priorRemoteId: 'remote-b');

      expect(await sut.findRevertReconcileTargets(), isEmpty);
    });

    test('finds a true revert: prior is the edit, checksum hashed back to the base', () async {
      await ctx.newStack(id: 'stack-1', ownerId: userId, primaryAssetId: 'edit');
      await ctx.newRemoteAsset(id: 'base', ownerId: userId, stackId: 'stack-1', checksum: 'base-sum');
      await ctx.newRemoteAsset(id: 'edit', ownerId: userId, stackId: 'stack-1', checksum: 'edit-sum');
      // Unreconciled: the chain last synced the edit bytes, the local now holds the base bytes.
      await ctx.newLocalAsset(id: 'local-1', checksum: 'base-sum', syncedChecksum: 'edit-sum', priorRemoteId: 'edit');

      final targets = await sut.findRevertReconcileTargets();

      expect(targets, hasLength(1));
      expect(targets.first.stackId, 'stack-1');
      expect(targets.first.newPrimaryId, 'base');
      expect(targets.first.localAssetId, 'local-1');
      expect(targets.first.localAssetChecksum, 'base-sum');
    });

    test('stops matching once the flip writes synced = checksum', () async {
      await ctx.newStack(id: 'stack-1', ownerId: userId, primaryAssetId: 'edit');
      await ctx.newRemoteAsset(id: 'base', ownerId: userId, stackId: 'stack-1', checksum: 'base-sum');
      await ctx.newRemoteAsset(id: 'edit', ownerId: userId, stackId: 'stack-1', checksum: 'edit-sum');
      await ctx.newLocalAsset(id: 'local-1', checksum: 'base-sum', syncedChecksum: 'edit-sum', priorRemoteId: 'edit');

      final targets = await sut.findRevertReconcileTargets();
      expect(targets, hasLength(1));

      // The reconcile flip rolls the stamps forward; that's what makes it self-limiting.
      final target = targets.first;
      await DriftLocalAssetRepository(
        ctx.db,
      ).markSynced(target.localAssetId, priorRemoteId: target.newPrimaryId, syncedChecksum: target.localAssetChecksum);

      expect(await sut.findRevertReconcileTargets(), isEmpty);
    });
  });
}
