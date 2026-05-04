import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/shared_space.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/shared_space_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/shared_space_library.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/shared_space_member.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/merged_asset.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

// Polls `predicate` on the event loop for up to `timeout` before failing the
// test. Used to wait for asynchronous stream emissions driven by Drift's
// table-change notifications.
Future<void> _waitFor(bool Function() predicate, {Duration timeout = const Duration(seconds: 2)}) async {
  final deadline = DateTime.now().add(timeout);
  while (!predicate()) {
    if (DateTime.now().isAfter(deadline)) {
      fail('Timed out after $timeout waiting for condition');
    }
    await Future<void>.delayed(const Duration(milliseconds: 10));
  }
}

Future<List<String>> _queryPlanDetails(Drift db, String sql) async {
  final rows = await db.customSelect('EXPLAIN QUERY PLAN $sql').get();
  return rows.map((row) => row.data['detail'] as String).toList(growable: false);
}

void main() {
  late Drift db;

  setUp(() {
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
  });

  tearDown(() async {
    await db.close();
  });

  test(
    'mergedBucket includes shared space assets for a viewer with showInTimeline=true even when they own no assets',
    () async {
      const ownerId = 'owner-1';
      const viewerId = 'viewer-1';
      const spaceId = 'space-1';
      const assetId = 'asset-1';
      final createdAt = DateTime(2024, 1, 1, 12);

      // Two users: an owner and a viewer.
      await db
          .into(db.userEntity)
          .insert(UserEntityCompanion.insert(id: ownerId, email: 'owner@test.dev', name: 'Owner'));
      await db
          .into(db.userEntity)
          .insert(UserEntityCompanion.insert(id: viewerId, email: 'viewer@test.dev', name: 'Viewer'));

      // The owner uploads an asset. The viewer owns nothing.
      await db
          .into(db.remoteAssetEntity)
          .insert(
            RemoteAssetEntityCompanion.insert(
              id: assetId,
              name: 'asset-1.jpg',
              type: AssetType.image,
              checksum: 'checksum-1',
              ownerId: ownerId,
              visibility: AssetVisibility.timeline,
              createdAt: Value(createdAt),
              updatedAt: Value(createdAt),
              localDateTime: Value(createdAt),
            ),
          );

      // A shared space owned by the owner, with the viewer as a member who
      // has explicitly enabled "show in timeline".
      await db
          .into(db.sharedSpaceEntity)
          .insert(SharedSpaceEntityCompanion.insert(id: spaceId, name: 'Test Space', createdById: ownerId));
      await db
          .into(db.sharedSpaceMemberEntity)
          .insert(
            SharedSpaceMemberEntityCompanion.insert(
              spaceId: spaceId,
              userId: viewerId,
              role: 'viewer',
              showInTimeline: const Value(true),
            ),
          );

      // The owner's asset is shared into the space.
      await db
          .into(db.sharedSpaceAssetEntity)
          .insert(SharedSpaceAssetEntityCompanion.insert(spaceId: spaceId, assetId: assetId));

      // From the viewer's main timeline, the asset should appear in a bucket.
      final buckets = await db.mergedAssetDrift
          .mergedBucket(groupBy: GroupAssetsBy.day.index, userIds: [viewerId], currentUserId: viewerId)
          .get();

      expect(buckets, hasLength(1));
      expect(buckets.single.assetCount, 1);
    },
  );

  test('mergedBucket includes library-linked shared space assets for a viewer with showInTimeline=true', () async {
    const ownerId = 'owner-1';
    const viewerId = 'viewer-1';
    const spaceId = 'space-1';
    const libraryId = 'library-1';
    const assetId = 'asset-1';
    final createdAt = DateTime(2024, 1, 1, 12);

    await db
        .into(db.userEntity)
        .insert(UserEntityCompanion.insert(id: ownerId, email: 'owner@test.dev', name: 'Owner'));
    await db
        .into(db.userEntity)
        .insert(UserEntityCompanion.insert(id: viewerId, email: 'viewer@test.dev', name: 'Viewer'));

    // An asset that belongs to a library owned by the owner.
    await db
        .into(db.remoteAssetEntity)
        .insert(
          RemoteAssetEntityCompanion.insert(
            id: assetId,
            name: 'lib-asset.jpg',
            type: AssetType.image,
            checksum: 'checksum-lib',
            ownerId: ownerId,
            visibility: AssetVisibility.timeline,
            createdAt: Value(createdAt),
            updatedAt: Value(createdAt),
            localDateTime: Value(createdAt),
            libraryId: const Value(libraryId),
          ),
        );

    // A space that has the library linked, not the individual asset.
    await db
        .into(db.sharedSpaceEntity)
        .insert(SharedSpaceEntityCompanion.insert(id: spaceId, name: 'Takeout', createdById: ownerId));
    await db
        .into(db.sharedSpaceMemberEntity)
        .insert(
          SharedSpaceMemberEntityCompanion.insert(
            spaceId: spaceId,
            userId: viewerId,
            role: 'viewer',
            showInTimeline: const Value(true),
          ),
        );
    await db
        .into(db.sharedSpaceLibraryEntity)
        .insert(SharedSpaceLibraryEntityCompanion.insert(spaceId: spaceId, libraryId: libraryId));

    final buckets = await db.mergedAssetDrift
        .mergedBucket(groupBy: GroupAssetsBy.day.index, userIds: [viewerId], currentUserId: viewerId)
        .get();

    expect(buckets, hasLength(1));
    expect(buckets.single.assetCount, 1);
  });

  test('mergedBucket excludes shared space assets when showInTimeline is false', () async {
    const ownerId = 'owner-1';
    const viewerId = 'viewer-1';
    const spaceId = 'space-1';
    const assetId = 'asset-1';
    final createdAt = DateTime(2024, 1, 1, 12);

    await db
        .into(db.userEntity)
        .insert(UserEntityCompanion.insert(id: ownerId, email: 'owner@test.dev', name: 'Owner'));
    await db
        .into(db.userEntity)
        .insert(UserEntityCompanion.insert(id: viewerId, email: 'viewer@test.dev', name: 'Viewer'));
    await db
        .into(db.remoteAssetEntity)
        .insert(
          RemoteAssetEntityCompanion.insert(
            id: assetId,
            name: 'asset-1.jpg',
            type: AssetType.image,
            checksum: 'checksum-1',
            ownerId: ownerId,
            visibility: AssetVisibility.timeline,
            createdAt: Value(createdAt),
            updatedAt: Value(createdAt),
            localDateTime: Value(createdAt),
          ),
        );
    await db
        .into(db.sharedSpaceEntity)
        .insert(SharedSpaceEntityCompanion.insert(id: spaceId, name: 'Hidden Space', createdById: ownerId));
    // Viewer IS a member, but explicitly opted out of their timeline.
    await db
        .into(db.sharedSpaceMemberEntity)
        .insert(
          SharedSpaceMemberEntityCompanion.insert(
            spaceId: spaceId,
            userId: viewerId,
            role: 'viewer',
            showInTimeline: const Value(false),
          ),
        );
    await db
        .into(db.sharedSpaceAssetEntity)
        .insert(SharedSpaceAssetEntityCompanion.insert(spaceId: spaceId, assetId: assetId));

    final buckets = await db.mergedAssetDrift
        .mergedBucket(groupBy: GroupAssetsBy.day.index, userIds: [viewerId], currentUserId: viewerId)
        .get();

    expect(buckets, isEmpty);
  });

  test('mergedBucket excludes shared space assets when the user is not a member', () async {
    const ownerId = 'owner-1';
    const outsiderId = 'outsider-1';
    const spaceId = 'space-1';
    const assetId = 'asset-1';
    final createdAt = DateTime(2024, 1, 1, 12);

    await db
        .into(db.userEntity)
        .insert(UserEntityCompanion.insert(id: ownerId, email: 'owner@test.dev', name: 'Owner'));
    await db
        .into(db.userEntity)
        .insert(UserEntityCompanion.insert(id: outsiderId, email: 'outsider@test.dev', name: 'Outsider'));
    await db
        .into(db.remoteAssetEntity)
        .insert(
          RemoteAssetEntityCompanion.insert(
            id: assetId,
            name: 'private.jpg',
            type: AssetType.image,
            checksum: 'checksum-private',
            ownerId: ownerId,
            visibility: AssetVisibility.timeline,
            createdAt: Value(createdAt),
            updatedAt: Value(createdAt),
            localDateTime: Value(createdAt),
          ),
        );
    await db
        .into(db.sharedSpaceEntity)
        .insert(SharedSpaceEntityCompanion.insert(id: spaceId, name: 'Private Space', createdById: ownerId));
    // Only the owner is a member; outsider is not.
    await db
        .into(db.sharedSpaceMemberEntity)
        .insert(
          SharedSpaceMemberEntityCompanion.insert(
            spaceId: spaceId,
            userId: ownerId,
            role: 'owner',
            showInTimeline: const Value(true),
          ),
        );
    await db
        .into(db.sharedSpaceAssetEntity)
        .insert(SharedSpaceAssetEntityCompanion.insert(spaceId: spaceId, assetId: assetId));

    final buckets = await db.mergedAssetDrift
        .mergedBucket(groupBy: GroupAssetsBy.day.index, userIds: [outsiderId], currentUserId: outsiderId)
        .get();

    expect(buckets, isEmpty);
  });

  test("mergedBucket does not leak a partner's shared-space assets into the current user's timeline", () async {
    // Scenario: userA has userB as a partner (showing in timeline). userB is a
    // member of a shared space with showInTimeline=true. userA should see
    // userB's own-owned assets (partner sharing) but NOT the space assets that
    // userB has opted to show in userB's own timeline — those are userB's
    // preference, not userA's.
    const userAId = 'user-a';
    const userBId = 'user-b';
    const ownerId = 'space-owner';
    const spaceId = 'space-1';
    const partnerAssetId = 'partner-asset';
    const spaceAssetId = 'space-asset';
    final createdAt = DateTime(2024, 1, 1, 12);

    await db.into(db.userEntity).insert(UserEntityCompanion.insert(id: userAId, email: 'a@test.dev', name: 'A'));
    await db.into(db.userEntity).insert(UserEntityCompanion.insert(id: userBId, email: 'b@test.dev', name: 'B'));
    await db
        .into(db.userEntity)
        .insert(UserEntityCompanion.insert(id: ownerId, email: 'owner@test.dev', name: 'Owner'));

    // Asset owned by userB — should appear in A's timeline via partner sharing.
    await db
        .into(db.remoteAssetEntity)
        .insert(
          RemoteAssetEntityCompanion.insert(
            id: partnerAssetId,
            name: 'partner.jpg',
            type: AssetType.image,
            checksum: 'checksum-partner',
            ownerId: userBId,
            visibility: AssetVisibility.timeline,
            createdAt: Value(createdAt),
            updatedAt: Value(createdAt),
            localDateTime: Value(createdAt),
          ),
        );

    // Asset owned by space owner, shared into a space userB is a member of.
    // userA is NOT a member of this space and should NOT see it.
    await db
        .into(db.remoteAssetEntity)
        .insert(
          RemoteAssetEntityCompanion.insert(
            id: spaceAssetId,
            name: 'space.jpg',
            type: AssetType.image,
            checksum: 'checksum-space',
            ownerId: ownerId,
            visibility: AssetVisibility.timeline,
            createdAt: Value(createdAt),
            updatedAt: Value(createdAt),
            localDateTime: Value(createdAt),
          ),
        );
    await db
        .into(db.sharedSpaceEntity)
        .insert(SharedSpaceEntityCompanion.insert(id: spaceId, name: 'B Space', createdById: ownerId));
    await db
        .into(db.sharedSpaceMemberEntity)
        .insert(
          SharedSpaceMemberEntityCompanion.insert(
            spaceId: spaceId,
            userId: userBId,
            role: 'viewer',
            showInTimeline: const Value(true),
          ),
        );
    await db
        .into(db.sharedSpaceAssetEntity)
        .insert(SharedSpaceAssetEntityCompanion.insert(spaceId: spaceId, assetId: spaceAssetId));

    // userA's main timeline — userIds represents A + B (B is a partner), but
    // currentUserId is A, so only A's space memberships drive the lookup.
    final buckets = await db.mergedAssetDrift
        .mergedBucket(groupBy: GroupAssetsBy.day.index, userIds: [userAId, userBId], currentUserId: userAId)
        .get();

    // Exactly one bucket with one asset: the partner asset. The space asset
    // must NOT appear because the current user (A) isn't in that space.
    expect(buckets, hasLength(1));
    expect(buckets.single.assetCount, 1);
  });

  test('mergedBucket deduplicates an asset that is both owned by the viewer and shared into their space', () async {
    const viewerId = 'viewer-1';
    const spaceId = 'space-1';
    const assetId = 'asset-1';
    final createdAt = DateTime(2024, 1, 1, 12);

    await db
        .into(db.userEntity)
        .insert(UserEntityCompanion.insert(id: viewerId, email: 'viewer@test.dev', name: 'Viewer'));
    await db
        .into(db.remoteAssetEntity)
        .insert(
          RemoteAssetEntityCompanion.insert(
            id: assetId,
            name: 'asset-1.jpg',
            type: AssetType.image,
            checksum: 'checksum-1',
            ownerId: viewerId,
            visibility: AssetVisibility.timeline,
            createdAt: Value(createdAt),
            updatedAt: Value(createdAt),
            localDateTime: Value(createdAt),
          ),
        );
    await db
        .into(db.sharedSpaceEntity)
        .insert(SharedSpaceEntityCompanion.insert(id: spaceId, name: 'Own Space', createdById: viewerId));
    await db
        .into(db.sharedSpaceMemberEntity)
        .insert(
          SharedSpaceMemberEntityCompanion.insert(
            spaceId: spaceId,
            userId: viewerId,
            role: 'owner',
            showInTimeline: const Value(true),
          ),
        );
    await db
        .into(db.sharedSpaceAssetEntity)
        .insert(SharedSpaceAssetEntityCompanion.insert(spaceId: spaceId, assetId: assetId));

    // The WHERE clause is owned-OR-shared; the asset matches both, but it's
    // still a single row in remote_asset_entity so it must be counted once.
    final buckets = await db.mergedAssetDrift
        .mergedBucket(groupBy: GroupAssetsBy.day.index, userIds: [viewerId], currentUserId: viewerId)
        .get();

    expect(buckets, hasLength(1));
    expect(buckets.single.assetCount, 1);
  });

  test('merged timeline shared-space predicates use reverse lookup indexes', () async {
    const viewerId = 'viewer-1';

    final details = await _queryPlanDetails(db, '''
      SELECT 1
      FROM remote_asset_entity AS rae
      WHERE EXISTS (
        SELECT 1
        FROM shared_space_asset_entity AS ssa
        INNER JOIN shared_space_member_entity AS ssm ON ssm.space_id = ssa.space_id
        WHERE ssa.asset_id = rae.id
          AND ssm.user_id = '$viewerId'
          AND ssm.show_in_timeline = 1
      )
      OR EXISTS (
        SELECT 1
        FROM shared_space_library_entity AS ssl
        INNER JOIN shared_space_member_entity AS ssm ON ssm.space_id = ssl.space_id
        WHERE ssl.library_id = rae.library_id
          AND ssm.user_id = '$viewerId'
          AND ssm.show_in_timeline = 1
      )
    ''');

    expect(details, contains(contains('idx_shared_space_asset_asset_space')));
    expect(details, contains(contains('idx_shared_space_library_library_space')));
    expect(details, isNot(contains(startsWith('SCAN ssa'))));
    expect(details, isNot(contains(startsWith('SCAN ssl'))));
  });

  test('mergedBucket watch stream re-emits when showInTimeline toggles on an existing member row', () async {
    // Regression: the shared_space_* tables were not listed in the
    // generated query's `readsFrom` set because they were only referenced
    // via EXISTS subqueries and the .drift file was missing the entity
    // imports. As a result, the user could toggle "show in timeline" but
    // the viewer's main timeline would stay stale until they navigated
    // away and back. Fixed by importing the shared_space_* entities in
    // merged_asset.drift so Drift's analyzer adds them to readsFrom and
    // .watch() re-runs the query on membership updates.
    const ownerId = 'owner-1';
    const viewerId = 'viewer-1';
    const spaceId = 'space-1';
    const assetId = 'asset-1';
    final createdAt = DateTime(2024, 1, 1, 12);

    await db
        .into(db.userEntity)
        .insert(UserEntityCompanion.insert(id: ownerId, email: 'owner@test.dev', name: 'Owner'));
    await db
        .into(db.userEntity)
        .insert(UserEntityCompanion.insert(id: viewerId, email: 'viewer@test.dev', name: 'Viewer'));
    await db
        .into(db.remoteAssetEntity)
        .insert(
          RemoteAssetEntityCompanion.insert(
            id: assetId,
            name: 'asset-1.jpg',
            type: AssetType.image,
            checksum: 'checksum-1',
            ownerId: ownerId,
            visibility: AssetVisibility.timeline,
            createdAt: Value(createdAt),
            updatedAt: Value(createdAt),
            localDateTime: Value(createdAt),
          ),
        );
    await db
        .into(db.sharedSpaceEntity)
        .insert(SharedSpaceEntityCompanion.insert(id: spaceId, name: 'Toggle Space', createdById: ownerId));
    // Viewer starts with showInTimeline=true → asset should appear.
    await db
        .into(db.sharedSpaceMemberEntity)
        .insert(
          SharedSpaceMemberEntityCompanion.insert(
            spaceId: spaceId,
            userId: viewerId,
            role: 'viewer',
            showInTimeline: const Value(true),
          ),
        );
    await db
        .into(db.sharedSpaceAssetEntity)
        .insert(SharedSpaceAssetEntityCompanion.insert(spaceId: spaceId, assetId: assetId));

    final emissions = <List<MergedBucketResult>>[];
    final subscription = db.mergedAssetDrift
        .mergedBucket(groupBy: GroupAssetsBy.day.index, userIds: [viewerId], currentUserId: viewerId)
        .watch()
        .listen(emissions.add);

    // First emission: asset is visible.
    await _waitFor(() => emissions.isNotEmpty);
    expect(emissions.last, hasLength(1));
    expect(emissions.last.single.assetCount, 1);

    // Viewer opts out of showing this space in their timeline. The stream
    // MUST re-emit with an empty list — otherwise the UI keeps showing
    // stale photos until the user navigates away.
    await (db.update(db.sharedSpaceMemberEntity)..where((t) => t.userId.equals(viewerId) & t.spaceId.equals(spaceId)))
        .write(const SharedSpaceMemberEntityCompanion(showInTimeline: Value(false)));

    await _waitFor(() => emissions.length >= 2);
    expect(emissions.last, isEmpty);

    await subscription.cancel();
  });

  test('mergedAsset returns the row for a shared-space asset visible to the viewer', () async {
    const ownerId = 'owner-1';
    const viewerId = 'viewer-1';
    const spaceId = 'space-1';
    const assetId = 'asset-1';
    final createdAt = DateTime(2024, 1, 1, 12);

    await db
        .into(db.userEntity)
        .insert(UserEntityCompanion.insert(id: ownerId, email: 'owner@test.dev', name: 'Owner'));
    await db
        .into(db.userEntity)
        .insert(UserEntityCompanion.insert(id: viewerId, email: 'viewer@test.dev', name: 'Viewer'));
    await db
        .into(db.remoteAssetEntity)
        .insert(
          RemoteAssetEntityCompanion.insert(
            id: assetId,
            name: 'asset-1.jpg',
            type: AssetType.image,
            checksum: 'checksum-1',
            ownerId: ownerId,
            visibility: AssetVisibility.timeline,
            createdAt: Value(createdAt),
            updatedAt: Value(createdAt),
            localDateTime: Value(createdAt),
          ),
        );
    await db
        .into(db.sharedSpaceEntity)
        .insert(SharedSpaceEntityCompanion.insert(id: spaceId, name: 'Test Space', createdById: ownerId));
    await db
        .into(db.sharedSpaceMemberEntity)
        .insert(
          SharedSpaceMemberEntityCompanion.insert(
            spaceId: spaceId,
            userId: viewerId,
            role: 'viewer',
            showInTimeline: const Value(true),
          ),
        );
    await db
        .into(db.sharedSpaceAssetEntity)
        .insert(SharedSpaceAssetEntityCompanion.insert(spaceId: spaceId, assetId: assetId));

    final rows = await db.mergedAssetDrift
        .mergedAsset(userIds: [viewerId], currentUserId: viewerId, limit: (_) => Limit(50, 0))
        .get();

    expect(rows, hasLength(1));
    expect(rows.single.remoteId, assetId);
  });

  test('mergedBucket falls back to createdAt when localDateTime is null', () async {
    const userId = 'user-1';
    final createdAt = DateTime(2024, 1, 1, 12);

    await db
        .into(db.userEntity)
        .insert(UserEntityCompanion.insert(id: userId, email: 'user-1@test.dev', name: 'User 1'));

    await db
        .into(db.remoteAssetEntity)
        .insert(
          RemoteAssetEntityCompanion.insert(
            id: 'asset-1',
            name: 'asset-1.jpg',
            type: AssetType.image,
            checksum: 'checksum-1',
            ownerId: userId,
            visibility: AssetVisibility.timeline,
            createdAt: Value(createdAt),
            updatedAt: Value(createdAt),
            localDateTime: const Value(null),
          ),
        );

    final buckets = await db.mergedAssetDrift
        .mergedBucket(groupBy: GroupAssetsBy.day.index, userIds: [userId], currentUserId: userId)
        .get();

    expect(buckets, hasLength(1));
    expect(buckets.single.assetCount, 1);
    expect(buckets.single.bucketDate, isNotEmpty);
  });
}
