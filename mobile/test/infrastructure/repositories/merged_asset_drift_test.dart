import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/stack.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

void main() {
  late Drift db;

  setUp(() {
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
  });

  tearDown(() async {
    await db.close();
  });

  Future<void> insertUser(String userId) {
    return db
        .into(db.userEntity)
        .insert(UserEntityCompanion.insert(id: userId, email: '$userId@test.dev', name: 'User $userId'));
  }

  Future<void> insertRemoteAsset({
    required String id,
    required String userId,
    required DateTime createdAt,
    String? stackId,
    DateTime? deletedAt,
  }) {
    return db
        .into(db.remoteAssetEntity)
        .insert(
          RemoteAssetEntityCompanion.insert(
            id: id,
            name: '$id.jpg',
            type: AssetType.image,
            checksum: 'checksum-$id',
            ownerId: userId,
            visibility: AssetVisibility.timeline,
            createdAt: Value(createdAt),
            updatedAt: Value(createdAt),
            deletedAt: Value(deletedAt),
            stackId: Value(stackId),
            localDateTime: Value(createdAt),
          ),
        );
  }

  test('mergedBucket falls back to createdAt when localDateTime is null', () async {
    const userId = 'user-1';
    final createdAt = DateTime(2024, 1, 1, 12);

    await insertUser(userId);

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

    final buckets = await db.mergedAssetDrift.mergedBucket(groupBy: GroupAssetsBy.day.index, userIds: [userId]).get();

    expect(buckets, hasLength(1));
    expect(buckets.single.assetCount, 1);
    expect(buckets.single.bucketDate, isNotEmpty);
  });

  test('mergedAsset uses a visible stack child when the primary asset is deleted', () async {
    const userId = 'user-1';
    const stackId = 'stack-1';
    final primaryCreatedAt = DateTime(2024, 1, 1, 12);
    final childCreatedAt = DateTime(2024, 1, 2, 12);

    await insertUser(userId);
    await insertRemoteAsset(
      id: 'primary',
      userId: userId,
      createdAt: primaryCreatedAt,
      stackId: stackId,
      deletedAt: DateTime(2024, 1, 3),
    );
    await insertRemoteAsset(id: 'child', userId: userId, createdAt: childCreatedAt, stackId: stackId);
    await db
        .into(db.stackEntity)
        .insert(StackEntityCompanion.insert(id: stackId, ownerId: userId, primaryAssetId: 'primary'));

    final assets = await db.mergedAssetDrift.mergedAsset(userIds: [userId], limit: (_) => Limit(10, 0)).get();

    expect(assets, hasLength(1));
    expect(assets.single.remoteId, 'child');
    expect(assets.single.stackId, stackId);
  });

  test('mergedBucket counts a stack when only a non-primary child is visible', () async {
    const userId = 'user-1';
    const stackId = 'stack-1';
    final primaryCreatedAt = DateTime(2024, 1, 1, 12);
    final childCreatedAt = DateTime(2024, 1, 2, 12);

    await insertUser(userId);
    await insertRemoteAsset(
      id: 'primary',
      userId: userId,
      createdAt: primaryCreatedAt,
      stackId: stackId,
      deletedAt: DateTime(2024, 1, 3),
    );
    await insertRemoteAsset(id: 'child', userId: userId, createdAt: childCreatedAt, stackId: stackId);
    await db
        .into(db.stackEntity)
        .insert(StackEntityCompanion.insert(id: stackId, ownerId: userId, primaryAssetId: 'primary'));

    final buckets = await db.mergedAssetDrift.mergedBucket(groupBy: GroupAssetsBy.day.index, userIds: [userId]).get();

    expect(buckets, hasLength(1));
    expect(buckets.single.assetCount, 1);
    expect(buckets.single.bucketDate, '2024-01-02');
  });
}
