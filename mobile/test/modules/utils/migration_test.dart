import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/platform/permission_api.g.dart';
import 'package:immich_mobile/utils/migration.dart';
import 'package:mocktail/mocktail.dart';

import '../../medium/repository_context.dart';
import '../../service.mocks.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late MediumRepositoryContext ctx;
  late MockNativeSyncApi nativeSyncApi;
  late MockPermissionApi permissionApi;

  setUpAll(() async {
    debugDefaultTargetPlatformOverride = TargetPlatform.android;
    ctx = MediumRepositoryContext();
    await StoreService.init(storeRepository: DriftStoreRepository(ctx.db), listenUpdates: false);
  });

  setUp(() async {
    nativeSyncApi = MockNativeSyncApi();
    permissionApi = MockPermissionApi();
    await Store.clear();
    await ctx.db.delete(ctx.db.localAssetEntity).go();
    await ctx.db.delete(ctx.db.trashedLocalAssetEntity).go();
    when(() => nativeSyncApi.hasMediaReadPermission()).thenAnswer((_) async => true);
    when(() => permissionApi.hasManageMediaPermission()).thenAnswer((_) async => true);
    when(
      () => nativeSyncApi.getAlbums(),
    ).thenAnswer((_) async => [PlatformAlbum(id: 'album', name: 'album', isCloud: false, assetCount: 1)]);
    when(() => nativeSyncApi.getAssetsForAlbum('album')).thenAnswer((_) async => []);
    when(() => nativeSyncApi.getTrashedAssets()).thenAnswer((_) async => {});
  });

  tearDownAll(() async {
    debugDefaultTargetPlatformOverride = null;
    await Store.clear();
    await ctx.dispose();
  });

  test('heals dates from MediaStore', () async {
    final wrongDate = DateTime.utc(2026);
    final platformDate = DateTime.utc(2019, 3, 15, 10, 30);
    await Store.put(StoreKey.version, 26);
    await ctx.newLocalAsset(id: 'local', createdAt: wrongDate, updatedAt: platformDate);
    await ctx.newTrashedLocalAsset(
      id: 'trashed',
      albumId: 'album',
      createdAt: wrongDate,
      updatedAt: platformDate,
      source: TrashOrigin.localSync,
    );
    when(() => nativeSyncApi.getAssetsForAlbum('album')).thenAnswer((_) async => [_asset('local', platformDate)]);
    when(() => nativeSyncApi.getTrashedAssets()).thenAnswer(
      (_) async => {
        'album': [_asset('trashed', platformDate)],
      },
    );

    await migrateDatabaseIfNeeded(ctx.db, nativeSyncApi, permissionApi);

    final local = await (ctx.db.select(ctx.db.localAssetEntity)..where((row) => row.id.equals('local'))).getSingle();
    final trashed = await (ctx.db.select(
      ctx.db.trashedLocalAssetEntity,
    )..where((row) => row.id.equals('trashed'))).getSingle();
    expect(local.createdAt, platformDate);
    expect(trashed.createdAt, platformDate);
    expect(Store.tryGet(StoreKey.version), 27);
  });

  test('keeps EXIF date without trash access', () async {
    final modifiedAt = DateTime.utc(2025);
    final takenAt = DateTime.utc(2026);
    await Store.put(StoreKey.version, 26);
    await ctx.newLocalAsset(id: 'exif', createdAt: takenAt, updatedAt: modifiedAt);
    when(
      () => nativeSyncApi.getAssetsForAlbum('album'),
    ).thenAnswer((_) async => [_asset('exif', takenAt, updatedAt: modifiedAt)]);
    when(() => permissionApi.hasManageMediaPermission()).thenAnswer((_) async => false);

    await migrateDatabaseIfNeeded(ctx.db, nativeSyncApi, permissionApi);

    final asset = await (ctx.db.select(ctx.db.localAssetEntity)..where((row) => row.id.equals('exif'))).getSingle();
    expect(asset.createdAt, takenAt);
    expect(Store.tryGet(StoreKey.version), 27);
    verifyNever(() => nativeSyncApi.getTrashedAssets());
  });

  test('retries after permission is granted', () async {
    final wrongDate = DateTime.utc(2026);
    final platformDate = DateTime.utc(2019);
    await Store.put(StoreKey.version, 26);
    await ctx.newLocalAsset(id: 'local', createdAt: wrongDate, updatedAt: platformDate);
    when(() => nativeSyncApi.hasMediaReadPermission()).thenAnswer((_) async => false);

    await migrateDatabaseIfNeeded(ctx.db, nativeSyncApi, permissionApi);

    expect(Store.tryGet(StoreKey.version), 26);
    verifyNever(() => nativeSyncApi.getAlbums());
    verifyNever(() => nativeSyncApi.getTrashedAssets());
    var asset = await (ctx.db.select(ctx.db.localAssetEntity)..where((row) => row.id.equals('local'))).getSingle();
    expect(asset.createdAt, wrongDate);

    when(() => nativeSyncApi.hasMediaReadPermission()).thenAnswer((_) async => true);
    when(() => nativeSyncApi.getAssetsForAlbum('album')).thenAnswer((_) async => [_asset('local', platformDate)]);

    await migrateDatabaseIfNeeded(ctx.db, nativeSyncApi, permissionApi);

    asset = await (ctx.db.select(ctx.db.localAssetEntity)..where((row) => row.id.equals('local'))).getSingle();
    expect(asset.createdAt, platformDate);
    expect(Store.tryGet(StoreKey.version), 27);
  });

  test('keeps version 26 when MediaStore read fails', () async {
    final wrongDate = DateTime.utc(2026);
    await Store.put(StoreKey.version, 26);
    await ctx.newLocalAsset(id: 'local', createdAt: wrongDate);
    when(() => nativeSyncApi.getAlbums()).thenThrow(StateError('query failed'));

    await migrateDatabaseIfNeeded(ctx.db, nativeSyncApi, permissionApi);

    final asset = await (ctx.db.select(ctx.db.localAssetEntity)..where((row) => row.id.equals('local'))).getSingle();
    expect(asset.createdAt, wrongDate);
    expect(Store.tryGet(StoreKey.version), 26);
  });

  test('heals out-of-range date and completes migration', () async {
    final wrongDate = DateTime.utc(2026);
    final before = DateTime.timestamp().subtract(const Duration(seconds: 1));
    await Store.put(StoreKey.version, 26);
    await ctx.newLocalAsset(id: 'local', createdAt: wrongDate);
    when(
      () => nativeSyncApi.getAssetsForAlbum('album'),
    ).thenAnswer((_) async => [_asset('local', wrongDate, createdAtSeconds: 8640000000001)]);

    await migrateDatabaseIfNeeded(ctx.db, nativeSyncApi, permissionApi);

    final after = DateTime.timestamp().add(const Duration(seconds: 1));
    final asset = await (ctx.db.select(ctx.db.localAssetEntity)..where((row) => row.id.equals('local'))).getSingle();
    expect(asset.createdAt.isBefore(before), isFalse);
    expect(asset.createdAt.isAfter(after), isFalse);
    expect(Store.tryGet(StoreKey.version), 27);
  });
}

class MockPermissionApi extends Mock implements PermissionApi {}

PlatformAsset _asset(String id, DateTime createdAt, {DateTime? updatedAt, int? createdAtSeconds}) => PlatformAsset(
  id: id,
  name: '$id.jpg',
  type: 1,
  createdAt: createdAtSeconds ?? createdAt.millisecondsSinceEpoch ~/ 1000,
  updatedAt: (updatedAt ?? createdAt).millisecondsSinceEpoch ~/ 1000,
  durationMs: 0,
  orientation: 0,
  isFavorite: false,
  playbackStyle: PlatformAssetPlaybackStyle.image,
);
