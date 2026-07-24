import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/services/trash_sync.service.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/trash_sync.entity.drift.dart';
import 'package:immich_mobile/platform/asset_media_api.g.dart';
import 'package:mocktail/mocktail.dart';

import '../service_context.dart';

void main() {
  late MediumServiceContext ctx;
  late TrashSyncService sut;
  late String userId;

  setUpAll(() => debugDefaultTargetPlatformOverride = .android);
  tearDownAll(() => debugDefaultTargetPlatformOverride = null);

  setUp(() async {
    ctx = await MediumServiceContext.init();
    sut = TrashSyncService(
      repo: ctx.trashSyncRepository,
      assetMediaApi: ctx.assetMediaApi,
      permission: ctx.permissionRepository,
      settings: ctx.settings,
    );
    userId = (await ctx.newUser()).id;
    await ctx.newAuthUser(id: userId);
    await ctx.settings.write(.trashSyncEnabled, true);

    when(() => ctx.assetMediaApi.trash(any())).thenAnswer(_mapStatus(.done));
    when(() => ctx.assetMediaApi.restore(any())).thenAnswer(_mapStatus(.done));
    when(() => ctx.assetMediaApi.trashedAmong(any())).thenAnswer((inv) async => _ids(inv));
  });

  tearDown(() => ctx.dispose());

  Future<({String localId, String remoteId, String checksum})> backedUpAsset({DateTime? remoteDeletedAt}) async {
    final remote = await ctx.newRemoteAsset(ownerId: userId, deletedAt: remoteDeletedAt);
    final local = await ctx.newLocalAsset(checksum: remote.checksum);
    final album = await ctx.newLocalAlbum(backupSelection: .selected);
    await ctx.newLocalAlbumAsset(albumId: album.id, assetId: local.id);
    return (localId: local.id, remoteId: remote.id, checksum: remote.checksum);
  }

  Future<TrashSyncStatus?> trashStatusOf(String id) async {
    final rows = (await ctx.db.select(ctx.db.trashSyncEntity).get()).where((r) => r.assetId == id).toList();
    return rows.isEmpty ? null : rows.first.status;
  }

  Future<bool> localAssetExists(String id) async =>
      (await ctx.db.select(ctx.db.localAssetEntity).get()).any((r) => r.id == id);

  Future<void> markAsset({required String localId, required String checksum, TrashSyncStatus status = .pending}) async {
    await ctx.db
        .into(ctx.db.trashSyncEntity)
        .insert(TrashSyncEntityCompanion.insert(assetId: localId, checksum: checksum, status: .new(status)));
  }

  test('trashed asset is recorded, trashed, and its local row pruned', () async {
    final asset = await backedUpAsset(remoteDeletedAt: .new(2026, 1, 1));

    await sut.reconcile();

    expect(await trashStatusOf(asset.localId), TrashSyncStatus.trashed);
    expect(await localAssetExists(asset.localId), isFalse);
  });

  test('trash sync disabled: trashed asset is left untouched', () async {
    await ctx.settings.write(.trashSyncEnabled, false);
    final asset = await backedUpAsset(remoteDeletedAt: .new(2026, 1, 1));

    await sut.reconcile();

    expect(await trashStatusOf(asset.localId), isNull);
    expect(await localAssetExists(asset.localId), isTrue);
    verifyNever(() => ctx.assetMediaApi.trash(any()));
  });

  test('trash pending asset that is removed from device is not trashed and marker is removed', () async {
    final asset = await backedUpAsset(remoteDeletedAt: .new(2026, 1, 1));
    when(() => ctx.assetMediaApi.trash(any())).thenAnswer(_mapStatus(.notFound));

    await sut.reconcile();

    expect(await trashStatusOf(asset.localId), isNull);
    expect(await localAssetExists(asset.localId), isTrue);
  });

  test('partner trash does not affect our local copy', () async {
    final partner = await ctx.newUser();
    final remote = await ctx.newRemoteAsset(ownerId: partner.id, deletedAt: .new(2026, 1, 1));
    final local = await ctx.newLocalAsset(checksum: remote.checksum);
    final album = await ctx.newLocalAlbum(backupSelection: .selected);
    await ctx.newLocalAlbumAsset(albumId: album.id, assetId: local.id);

    await sut.reconcile();

    expect(await trashStatusOf(local.id), isNull);
    expect(await localAssetExists(local.id), isTrue);
    verifyNever(() => ctx.assetMediaApi.trash(any()));
  });

  test('trash pending marker is removed when the asset is back', () async {
    final asset = await backedUpAsset(remoteDeletedAt: null);
    await markAsset(localId: asset.localId, checksum: asset.checksum);

    await sut.reconcile();

    expect(await trashStatusOf(asset.localId), isNull);
    expect(await localAssetExists(asset.localId), isTrue);
    verifyNever(() => ctx.assetMediaApi.trash(any()));
  });

  test('reupload after a failed trash cleans the marker', () async {
    final asset = await backedUpAsset(remoteDeletedAt: .new(2026, 1, 1));
    when(() => ctx.assetMediaApi.trash(any())).thenAnswer(_mapStatus(.failed));

    await sut.reconcile();
    expect(await trashStatusOf(asset.localId), TrashSyncStatus.pending);
    expect(await localAssetExists(asset.localId), isTrue);

    await (ctx.db.update(
      ctx.db.remoteAssetEntity,
    )..where((t) => t.id.equals(asset.remoteId))).write(const RemoteAssetEntityCompanion(deletedAt: .new(null)));
    when(() => ctx.assetMediaApi.trash(any())).thenAnswer(_mapStatus(.done));

    await sut.reconcile();
    expect(await trashStatusOf(asset.localId), isNull);
    expect(await localAssetExists(asset.localId), isTrue);
  });

  test('server delete is also sent to the OS trash', () async {
    final asset = await backedUpAsset(remoteDeletedAt: null);
    await ctx.trashSyncRepository.recordHardDeletedChecksums([asset.remoteId]);
    await (ctx.db.delete(ctx.db.remoteAssetEntity)..where((t) => t.id.equals(asset.remoteId))).go();

    await sut.reconcile();

    expect(await trashStatusOf(asset.localId), TrashSyncStatus.trashed);
    expect(await localAssetExists(asset.localId), isFalse);
  });

  test('trashed asset permanently deleted from the server stays trashed on device', () async {
    await markAsset(localId: 'asset', checksum: 'checksum', status: .trashed);

    await sut.reconcile();

    expect(await trashStatusOf('asset'), TrashSyncStatus.trashed);
    verifyNever(() => ctx.assetMediaApi.restore(any()));
  });

  test('permanently deleted asset, that was externally trashed and restored is marked as dismissed', () async {
    final asset = await backedUpAsset(remoteDeletedAt: null);
    await ctx.trashSyncRepository.recordHardDeletedChecksums([asset.remoteId]);
    await (ctx.db.delete(ctx.db.remoteAssetEntity)..where((t) => t.id.equals(asset.remoteId))).go();
    when(() => ctx.assetMediaApi.trash(any())).thenAnswer(_mapStatus(.alreadyInState));

    await sut.reconcile();
    expect(await trashStatusOf(asset.localId), TrashSyncStatus.trashed);
    expect(await localAssetExists(asset.localId), isFalse);

    await ctx.newLocalAsset(id: asset.localId, checksum: asset.checksum);
    when(() => ctx.assetMediaApi.trashedAmong(any())).thenAnswer((_) async => const <String>[]);

    await sut.reconcile();
    expect(await trashStatusOf(asset.localId), TrashSyncStatus.dismissed);
    expect(await localAssetExists(asset.localId), isTrue);
  });

  test('dismissed guard prevents assets from being re-trashed again', () async {
    final remote = await ctx.newRemoteAsset(ownerId: userId, deletedAt: .new(2026, 1, 1));
    final album = await ctx.newLocalAlbum(backupSelection: .selected);
    await markAsset(localId: 'asset', checksum: remote.checksum, status: .dismissed);

    await sut.reconcile();
    expect(await trashStatusOf('asset'), TrashSyncStatus.dismissed);

    final local = await ctx.newLocalAsset(id: 'asset', checksum: remote.checksum);
    await ctx.newLocalAlbumAsset(albumId: album.id, assetId: local.id);

    await sut.reconcile();

    expect(await trashStatusOf('asset'), TrashSyncStatus.dismissed);
    expect(await localAssetExists('asset'), isTrue);
    verifyNever(() => ctx.assetMediaApi.trash(any()));
  });

  test('dismissed guard is pruned once its asset is back on the server', () async {
    final remote = await ctx.newRemoteAsset(ownerId: userId, deletedAt: null);
    await markAsset(localId: 'asset', checksum: remote.checksum, status: .dismissed);

    await sut.reconcile();

    expect(await trashStatusOf('asset'), isNull);
  });

  test('restored assets are restored locally and marked for backfill', () async {
    final remote = await ctx.newRemoteAsset(ownerId: userId, deletedAt: null);
    await markAsset(localId: 'asset', checksum: remote.checksum, status: .trashed);

    await sut.reconcile();

    verify(() => ctx.assetMediaApi.restore(['asset'])).called(1);
    expect(await trashStatusOf('asset'), TrashSyncStatus.restored);
  });

  test('restorable asset with not found status has its marker dropped', () async {
    final remote = await ctx.newRemoteAsset(ownerId: userId, deletedAt: null);
    await markAsset(localId: 'asset', checksum: remote.checksum, status: .trashed);
    when(() => ctx.assetMediaApi.restore(any())).thenAnswer(_mapStatus(.notFound));

    await sut.reconcile();

    expect(await trashStatusOf('asset'), isNull);
  });

  test('backlog handled when MANAGE_MEDIA was off and handled when on', () async {
    await markAsset(localId: 'asset1', checksum: 'checksum1');
    await markAsset(localId: 'asset2', checksum: 'checksum2');

    when(() => ctx.permissionRepository.hasManageMediaPermission()).thenAnswer((_) async => false);
    await sut.reconcile();
    expect(await trashStatusOf('asset1'), TrashSyncStatus.pending);
    verifyNever(() => ctx.assetMediaApi.trash(any()));

    when(() => ctx.permissionRepository.hasManageMediaPermission()).thenAnswer((_) async => true);
    await sut.reconcile();
    expect(await trashStatusOf('asset1'), TrashSyncStatus.trashed);
    expect(await trashStatusOf('asset2'), TrashSyncStatus.trashed);
  });

  test('iOS: reconcile maintains the list but never trashes', () async {
    debugDefaultTargetPlatformOverride = .iOS;
    addTearDown(() => debugDefaultTargetPlatformOverride = .android);
    await markAsset(localId: 'asset', checksum: 'checksum');

    await sut.reconcile();

    expect(await trashStatusOf('asset'), TrashSyncStatus.pending);
    verifyNever(() => ctx.assetMediaApi.trash(any()));
  });
}

Future<List<AssetMediaActionResult>> Function(Invocation) _mapStatus(AssetMediaActionStatus status) =>
    (inv) async => _ids(inv).map((id) => AssetMediaActionResult(id: id, status: status)).toList();

List<String> _ids(Invocation inv) => (inv.positionalArguments.first as List).cast<String>();
