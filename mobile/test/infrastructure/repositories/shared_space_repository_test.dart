import 'package:drift/drift.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/infrastructure/repositories/timeline.repository.dart';
import 'package:intl/date_symbol_data_local.dart';

import '../../medium/repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late DriftTimelineRepository sut;

  setUpAll(() async {
    await initializeDateFormatting('en');
  });

  setUp(() async {
    ctx = MediumRepositoryContext();
    sut = DriftTimelineRepository(ctx.db);
  });

  tearDown(() async {
    await ctx.dispose();
  });

  group('sharedSpace() TimelineQuery', () {
    late String userId;
    late String spaceId;

    setUp(() async {
      final user = await ctx.newUser();
      userId = user.id;
      final space = await ctx.newSharedSpace(createdById: userId);
      spaceId = space.id;
    });

    test('returns empty bucket list for a space with no assets', () async {
      final query = sut.sharedSpace(spaceId, GroupAssetsBy.day);
      final buckets = await query.bucketSource().first;
      expect(buckets, isEmpty);
    });

    test('returns bucket counts grouped by day', () async {
      final asset1 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 4, 1, 12));
      final asset2 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 4, 1, 18));
      final asset3 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 4, 2, 9));
      await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: asset1.id);
      await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: asset2.id);
      await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: asset3.id);

      final query = sut.sharedSpace(spaceId, GroupAssetsBy.day);
      final buckets = await query.bucketSource().first;

      expect(buckets, hasLength(2));
      // Buckets are returned in DESC order of date.
      expect(buckets[0].assetCount, 1); // April 2
      expect(buckets[1].assetCount, 2); // April 1
    });

    test('returns assets ordered by createdAt DESC', () async {
      final asset1 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 4, 1));
      final asset2 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 4, 5));
      final asset3 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 4, 3));
      await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: asset1.id);
      await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: asset2.id);
      await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: asset3.id);

      final query = sut.sharedSpace(spaceId, GroupAssetsBy.day);
      final assets = await query.assetSource(0, 10);

      expect(assets, hasLength(3));
      expect(assets[0].remoteId, asset2.id); // April 5
      expect(assets[1].remoteId, asset3.id); // April 3
      expect(assets[2].remoteId, asset1.id); // April 1
    });

    test('respects offset and limit on the asset source', () async {
      for (var i = 0; i < 5; i++) {
        final asset = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 4, i + 1));
        await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: asset.id);
      }

      final query = sut.sharedSpace(spaceId, GroupAssetsBy.day);
      final slice = await query.assetSource(1, 2);
      expect(slice, hasLength(2));
    });

    test('returns assets owned by other users (foreign assets)', () async {
      final otherUser = await ctx.newUser();
      final foreignAsset = await ctx.newRemoteAsset(ownerId: otherUser.id, createdAt: DateTime(2026, 4, 4));
      await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: foreignAsset.id);

      final query = sut.sharedSpace(spaceId, GroupAssetsBy.day);
      final assets = await query.assetSource(0, 10);

      expect(assets, hasLength(1));
      expect(assets[0].remoteId, foreignAsset.id);
    });

    test('returns NO assets when querying a different space', () async {
      // Create a second space, insert assets only into it.
      final otherSpace = await ctx.newSharedSpace(createdById: userId);
      final asset = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 4, 4));
      await ctx.insertSharedSpaceAsset(spaceId: otherSpace.id, assetId: asset.id);

      // Query the FIRST space's timeline. Assert it returns zero buckets and zero assets.
      // This locks in the per-space scoping property — without it, the query could leak across spaces.
      final query = sut.sharedSpace(spaceId, GroupAssetsBy.day);
      final buckets = await query.bucketSource().first;
      final assets = await query.assetSource(0, 10);

      expect(buckets, isEmpty);
      expect(assets, isEmpty);
    });

    test('does not return soft-deleted assets', () async {
      final liveAsset = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 4, 4));
      final deletedAsset = await ctx.newRemoteAsset(
        ownerId: userId,
        createdAt: DateTime(2026, 4, 4),
        deletedAt: DateTime(2026, 4, 5),
      );
      await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: liveAsset.id);
      await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: deletedAsset.id);

      final query = sut.sharedSpace(spaceId, GroupAssetsBy.day);
      final assets = await query.assetSource(0, 10);

      expect(assets, hasLength(1));
      expect(assets[0].remoteId, liveAsset.id);
    });

    test('does not return hidden Live Photo motion videos as separate assets', () async {
      final motionVideo = await ctx.newRemoteAsset(
        ownerId: userId,
        type: AssetType.video,
        visibility: AssetVisibility.hidden,
        createdAt: DateTime(2026, 4, 4, 12),
      );
      final stillImage = await ctx.newRemoteAsset(
        ownerId: userId,
        type: AssetType.image,
        livePhotoVideoId: motionVideo.id,
        createdAt: DateTime(2026, 4, 4, 12),
      );

      await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: stillImage.id);
      await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: motionVideo.id);

      final query = sut.sharedSpace(spaceId, GroupAssetsBy.day);
      final assets = await query.assetSource(0, 10);
      final buckets = await query.bucketSource().first;

      expect(assets, hasLength(1));
      expect(assets.single.remoteId, stillImage.id);
      expect(assets.single.livePhotoVideoId, motionVideo.id);
      expect(buckets, hasLength(1));
      expect(buckets.single.assetCount, 1);
    });

    test('bucket stream is reactive — emits new buckets when an asset is added after subscription', () async {
      final query = sut.sharedSpace(spaceId, GroupAssetsBy.day);
      final emissions = <List<Bucket>>[];
      final sub = query.bucketSource().listen(emissions.add);

      // Wait for the initial empty emission
      await Future<void>.delayed(const Duration(milliseconds: 50));
      expect(emissions, hasLength(1));
      expect(emissions[0], isEmpty);

      // Insert an asset and verify a new emission arrives
      final asset = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 4, 1));
      await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: asset.id);
      await Future<void>.delayed(const Duration(milliseconds: 100));

      expect(emissions.length, greaterThanOrEqualTo(2));
      expect(emissions.last, hasLength(1));
      expect(emissions.last[0].assetCount, 1);

      await sub.cancel();
    });

    test('groups by month when GroupAssetsBy.month', () async {
      // Use mid-day times to avoid timezone wraparound at midnight (the SQL
      // strftime sees the UTC representation, so naive midnight values can
      // shift to the previous month in non-UTC zones).
      final asset1 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 4, 5, 12));
      final asset2 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 4, 15, 12));
      final asset3 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 5, 5, 12));
      await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: asset1.id);
      await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: asset2.id);
      await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: asset3.id);

      final query = sut.sharedSpace(spaceId, GroupAssetsBy.month);
      final buckets = await query.bucketSource().first;

      // Two months: April (2 assets) and May (1 asset), DESC.
      expect(buckets, hasLength(2));
      expect(buckets[0].assetCount, 1); // May
      expect(buckets[1].assetCount, 2); // April
    });

    test('returns a single ungrouped bucket when GroupAssetsBy.none', () async {
      final asset1 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 4, 5, 12));
      final asset2 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 4, 15, 12));
      final asset3 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 5, 5, 12));
      await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: asset1.id);
      await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: asset2.id);
      await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: asset3.id);

      final query = sut.sharedSpace(spaceId, GroupAssetsBy.none);
      final buckets = await query.bucketSource().first;

      // none groups everything into a single bucket containing all assets.
      expect(buckets, hasLength(1));
      expect(buckets[0].assetCount, 3);
    });

    group('library UNION', () {
      test('returns library-linked assets only (no direct-add)', () async {
        final library = await ctx.newLibrary(ownerId: userId);
        await ctx.insertSharedSpaceLibrary(spaceId: spaceId, libraryId: library.id);

        final asset1 = await ctx.newRemoteAsset(
          ownerId: userId,
          libraryId: library.id,
          createdAt: DateTime(2026, 4, 1, 12),
        );
        final asset2 = await ctx.newRemoteAsset(
          ownerId: userId,
          libraryId: library.id,
          createdAt: DateTime(2026, 4, 2, 12),
        );

        final query = sut.sharedSpace(spaceId, GroupAssetsBy.day);
        final assets = await query.assetSource(0, 10);
        final buckets = await query.bucketSource().first;

        expect(assets, hasLength(2));
        final ids = assets.map((a) => a.remoteId).toSet();
        expect(ids, {asset1.id, asset2.id});
        expect(buckets, hasLength(2));
      });

      test('returns direct-add assets only (regression check, no library link)', () async {
        final asset = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 4, 1, 12));
        await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: asset.id);

        final query = sut.sharedSpace(spaceId, GroupAssetsBy.day);
        final assets = await query.assetSource(0, 10);

        expect(assets, hasLength(1));
        expect(assets[0].remoteId, asset.id);
      });

      test('unions direct-add and library assets without duplicating when an asset is in both', () async {
        final library = await ctx.newLibrary(ownerId: userId);
        await ctx.insertSharedSpaceLibrary(spaceId: spaceId, libraryId: library.id);

        // asset A — library only
        final assetA = await ctx.newRemoteAsset(
          ownerId: userId,
          libraryId: library.id,
          createdAt: DateTime(2026, 4, 1, 12),
        );
        // asset B — direct-add only (random libraryId)
        final assetB = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 4, 2, 12));
        await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: assetB.id);
        // asset C — BOTH library AND direct-add
        final assetC = await ctx.newRemoteAsset(
          ownerId: userId,
          libraryId: library.id,
          createdAt: DateTime(2026, 4, 3, 12),
        );
        await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: assetC.id);

        final query = sut.sharedSpace(spaceId, GroupAssetsBy.day);
        final assets = await query.assetSource(0, 10);

        expect(assets, hasLength(3));
        final ids = assets.map((a) => a.remoteId).toList();
        // each asset appears exactly once — no duplication from the OR branches
        expect(ids.toSet(), {assetA.id, assetB.id, assetC.id});
        expect(ids.length, ids.toSet().length);
      });

      test('handles populated shared_space_asset with empty shared_space_library', () async {
        final asset = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 4, 1, 12));
        await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: asset.id);

        // No shared_space_library rows; UNION should still return the direct-add asset.
        final query = sut.sharedSpace(spaceId, GroupAssetsBy.day);
        final assets = await query.assetSource(0, 10);

        expect(assets, hasLength(1));
        expect(assets[0].remoteId, asset.id);
      });

      test('handles populated shared_space_library with empty shared_space_asset', () async {
        final library = await ctx.newLibrary(ownerId: userId);
        await ctx.insertSharedSpaceLibrary(spaceId: spaceId, libraryId: library.id);
        final asset = await ctx.newRemoteAsset(
          ownerId: userId,
          libraryId: library.id,
          createdAt: DateTime(2026, 4, 1, 12),
        );

        // No shared_space_asset rows; UNION should still return the library asset.
        final query = sut.sharedSpace(spaceId, GroupAssetsBy.day);
        final assets = await query.assetSource(0, 10);

        expect(assets, hasLength(1));
        expect(assets[0].remoteId, asset.id);
      });

      test('reactive stream: removing a shared_space_library row drops library assets', () async {
        final library = await ctx.newLibrary(ownerId: userId);
        await ctx.insertSharedSpaceLibrary(spaceId: spaceId, libraryId: library.id);
        await ctx.newRemoteAsset(ownerId: userId, libraryId: library.id, createdAt: DateTime(2026, 4, 1, 12));

        final query = sut.sharedSpace(spaceId, GroupAssetsBy.day);
        final emissions = <List<Bucket>>[];
        final sub = query.bucketSource().listen(emissions.add);

        await Future<void>.delayed(const Duration(milliseconds: 50));
        expect(emissions.isNotEmpty, isTrue);
        expect(emissions.last, hasLength(1));

        // Remove the library link — the asset should drop out of the space timeline.
        await (ctx.db.delete(
          ctx.db.sharedSpaceLibraryEntity,
        )..where((row) => row.spaceId.equals(spaceId) & row.libraryId.equals(library.id))).go();
        await Future<void>.delayed(const Duration(milliseconds: 100));

        expect(emissions.last, isEmpty);
        await sub.cancel();
      });

      test('reactive stream: inserting a new remote asset with a linked libraryId fires an emission', () async {
        final library = await ctx.newLibrary(ownerId: userId);
        await ctx.insertSharedSpaceLibrary(spaceId: spaceId, libraryId: library.id);

        final query = sut.sharedSpace(spaceId, GroupAssetsBy.day);
        final emissions = <List<Bucket>>[];
        final sub = query.bucketSource().listen(emissions.add);

        await Future<void>.delayed(const Duration(milliseconds: 50));
        expect(emissions, hasLength(1));
        expect(emissions[0], isEmpty);

        // Insert an asset directly tagged with the linked libraryId
        await ctx.newRemoteAsset(ownerId: userId, libraryId: library.id, createdAt: DateTime(2026, 4, 1, 12));
        await Future<void>.delayed(const Duration(milliseconds: 100));

        expect(emissions.length, greaterThanOrEqualTo(2));
        expect(emissions.last, hasLength(1));
        expect(emissions.last[0].assetCount, 1);
        await sub.cancel();
      });

      test('reactive stream: inserting a new library link exposes pre-existing library assets', () async {
        final library = await ctx.newLibrary(ownerId: userId);
        // Library has assets BEFORE the link exists.
        await ctx.newRemoteAsset(ownerId: userId, libraryId: library.id, createdAt: DateTime(2026, 4, 1, 12));
        await ctx.newRemoteAsset(ownerId: userId, libraryId: library.id, createdAt: DateTime(2026, 4, 2, 12));

        final query = sut.sharedSpace(spaceId, GroupAssetsBy.day);
        final emissions = <List<Bucket>>[];
        final sub = query.bucketSource().listen(emissions.add);

        await Future<void>.delayed(const Duration(milliseconds: 50));
        expect(emissions, hasLength(1));
        expect(emissions[0], isEmpty);

        // Now link the library — the pre-existing assets should appear.
        await ctx.insertSharedSpaceLibrary(spaceId: spaceId, libraryId: library.id);
        await Future<void>.delayed(const Duration(milliseconds: 100));

        expect(emissions.length, greaterThanOrEqualTo(2));
        expect(emissions.last, hasLength(2));
        await sub.cancel();
      });

      test('interleaved ordering: library and direct-add assets sorted DESC across both sources', () async {
        // The UNION must sort the merged result by createdAt DESC, not by
        // source. Mix 6 assets where library and direct-add alternate —
        // the output order must be strictly DESC regardless of which
        // branch each row came from.
        final library = await ctx.newLibrary(ownerId: userId);
        await ctx.insertSharedSpaceLibrary(spaceId: spaceId, libraryId: library.id);

        // Interleave: lib(day1) → direct(day2) → lib(day3) → direct(day4) → lib(day5) → direct(day6)
        final lib1 = await ctx.newRemoteAsset(
          ownerId: userId,
          libraryId: library.id,
          createdAt: DateTime(2026, 4, 1, 12),
        );
        final direct2 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 4, 2, 12));
        await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: direct2.id);
        final lib3 = await ctx.newRemoteAsset(
          ownerId: userId,
          libraryId: library.id,
          createdAt: DateTime(2026, 4, 3, 12),
        );
        final direct4 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 4, 4, 12));
        await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: direct4.id);
        final lib5 = await ctx.newRemoteAsset(
          ownerId: userId,
          libraryId: library.id,
          createdAt: DateTime(2026, 4, 5, 12),
        );
        final direct6 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 4, 6, 12));
        await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: direct6.id);

        final query = sut.sharedSpace(spaceId, GroupAssetsBy.day);
        final assets = await query.assetSource(0, 20);

        final ids = assets.map((a) => a.remoteId).toList();
        // DESC order: direct6, lib5, direct4, lib3, direct2, lib1
        expect(ids, [direct6.id, lib5.id, direct4.id, lib3.id, direct2.id, lib1.id]);
      });

      test('bucket grouping: GroupAssetsBy.day emits one bucket per day across both sources', () async {
        // 2 library assets on day A, 2 direct-add assets on day B, 1 of
        // each on day C. Expected: 3 buckets, counts [2, 2, 2].
        final library = await ctx.newLibrary(ownerId: userId);
        await ctx.insertSharedSpaceLibrary(spaceId: spaceId, libraryId: library.id);

        // Day A (lib only, 2 assets)
        await ctx.newRemoteAsset(ownerId: userId, libraryId: library.id, createdAt: DateTime(2026, 4, 3, 10));
        await ctx.newRemoteAsset(ownerId: userId, libraryId: library.id, createdAt: DateTime(2026, 4, 3, 14));
        // Day B (direct only, 2 assets)
        final d1 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 4, 2, 10));
        final d2 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 4, 2, 14));
        await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: d1.id);
        await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: d2.id);
        // Day C (mix, 1 of each)
        await ctx.newRemoteAsset(ownerId: userId, libraryId: library.id, createdAt: DateTime(2026, 4, 1, 10));
        final d3 = await ctx.newRemoteAsset(ownerId: userId, createdAt: DateTime(2026, 4, 1, 14));
        await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: d3.id);

        final query = sut.sharedSpace(spaceId, GroupAssetsBy.day);
        final buckets = await query.bucketSource().first;

        expect(buckets, hasLength(3));
        // DESC order by day: Day A (04-03) first with 2, Day B (04-02) with 2, Day C (04-01) with 2.
        expect(buckets.map((b) => b.assetCount).toList(), [2, 2, 2]);
      });

      test('space links a library that has zero assets: empty timeline without crash', () async {
        // Linking an empty library to a space is a legitimate state (e.g.
        // import paths not yet crawled). The timeline query must not
        // crash and must return an empty bucket list.
        final library = await ctx.newLibrary(ownerId: userId);
        await ctx.insertSharedSpaceLibrary(spaceId: spaceId, libraryId: library.id);

        final query = sut.sharedSpace(spaceId, GroupAssetsBy.day);
        final buckets = await query.bucketSource().first;
        final assets = await query.assetSource(0, 10);
        expect(buckets, isEmpty);
        expect(assets, isEmpty);
      });

      test('asset with a dangling libraryId (not linked to this space) is NOT returned', () async {
        // An asset carries library_id = X but X is not in the
        // shared_space_library join table for this space. The asset must
        // NOT appear in the timeline. This catches a bug where the UNION
        // predicate would incorrectly match on libraryId alone.
        final linkedLib = await ctx.newLibrary(ownerId: userId);
        final danglingLib = await ctx.newLibrary(ownerId: userId);
        await ctx.insertSharedSpaceLibrary(spaceId: spaceId, libraryId: linkedLib.id);

        // Asset in the linked library — should appear.
        final visible = await ctx.newRemoteAsset(
          ownerId: userId,
          libraryId: linkedLib.id,
          createdAt: DateTime(2026, 4, 1, 12),
        );
        // Asset in the dangling library — should NOT appear.
        await ctx.newRemoteAsset(ownerId: userId, libraryId: danglingLib.id, createdAt: DateTime(2026, 4, 2, 12));

        final query = sut.sharedSpace(spaceId, GroupAssetsBy.day);
        final assets = await query.assetSource(0, 10);
        expect(assets, hasLength(1));
        expect(assets.first.remoteId, visible.id);
      });

      test('soft-deleted library asset is excluded from the timeline', () async {
        // remote_asset_entity.deleted_at IS NULL is a baseline filter on
        // every timeline query. A library asset with deleted_at set must
        // not appear, even though the library link is intact.
        final library = await ctx.newLibrary(ownerId: userId);
        await ctx.insertSharedSpaceLibrary(spaceId: spaceId, libraryId: library.id);

        final live = await ctx.newRemoteAsset(
          ownerId: userId,
          libraryId: library.id,
          createdAt: DateTime(2026, 4, 1, 12),
        );
        await ctx.newRemoteAsset(
          ownerId: userId,
          libraryId: library.id,
          createdAt: DateTime(2026, 4, 2, 12),
          deletedAt: DateTime(2026, 4, 3, 12),
        );

        final query = sut.sharedSpace(spaceId, GroupAssetsBy.day);
        final assets = await query.assetSource(0, 10);
        expect(assets, hasLength(1));
        expect(assets.first.remoteId, live.id);
      });

      test('multi-library single-space: dedupes assets present in two linked libraries (none direct)', () async {
        // A space links two libraries, libA and libB. The same asset cannot belong
        // to both (asset.libraryId is single-valued), so the dedup property here
        // is about ensuring the UNION returns the union of both libraries' assets
        // exactly once each — not about an asset appearing twice. Combined with
        // a third asset that IS direct-add only (not in either library), the
        // total expected count is the sum of all distinct assets, with no
        // duplication from the OR branches even though all three rows match the
        // membership predicate via different paths.
        final libA = await ctx.newLibrary(ownerId: userId);
        final libB = await ctx.newLibrary(ownerId: userId);
        await ctx.insertSharedSpaceLibrary(spaceId: spaceId, libraryId: libA.id);
        await ctx.insertSharedSpaceLibrary(spaceId: spaceId, libraryId: libB.id);

        // 2 assets in libA
        final a1 = await ctx.newRemoteAsset(ownerId: userId, libraryId: libA.id, createdAt: DateTime(2026, 4, 1, 12));
        final a2 = await ctx.newRemoteAsset(ownerId: userId, libraryId: libA.id, createdAt: DateTime(2026, 4, 2, 12));
        // 2 assets in libB
        final b1 = await ctx.newRemoteAsset(ownerId: userId, libraryId: libB.id, createdAt: DateTime(2026, 4, 3, 12));
        final b2 = await ctx.newRemoteAsset(ownerId: userId, libraryId: libB.id, createdAt: DateTime(2026, 4, 4, 12));
        // 1 asset that is BOTH in libA AND directly added — exercises the OR-dedup
        // path (the row matches the libraryId branch AND the id branch).
        final c1 = await ctx.newRemoteAsset(ownerId: userId, libraryId: libA.id, createdAt: DateTime(2026, 4, 5, 12));
        await ctx.insertSharedSpaceAsset(spaceId: spaceId, assetId: c1.id);
        // 1 asset that is in an unrelated library (NOT linked to this space) —
        // must NOT appear in the timeline.
        final unrelatedLib = await ctx.newLibrary(ownerId: userId);
        await ctx.newRemoteAsset(ownerId: userId, libraryId: unrelatedLib.id, createdAt: DateTime(2026, 4, 6, 12));

        final query = sut.sharedSpace(spaceId, GroupAssetsBy.day);
        final assets = await query.assetSource(0, 20);

        final ids = assets.map((a) => a.remoteId).toList();
        expect(ids, hasLength(5));
        expect(ids.toSet(), {a1.id, a2.id, b1.id, b2.id, c1.id});
        // No duplication from the OR branches even when an asset matches both.
        expect(ids.length, ids.toSet().length);
      });
    });
  });
}
