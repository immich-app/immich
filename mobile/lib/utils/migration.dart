// ignore_for_file: deprecated_member_use_from_same_package

import 'dart:async';

import 'package:flutter/cupertino.dart';
import 'package:hive/hive.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/album/services/album_cache.service.dart';
import 'package:immich_mobile/modules/backup/models/backup_album.model.dart';
import 'package:immich_mobile/modules/backup/models/duplicated_asset.model.dart';
import 'package:immich_mobile/modules/backup/models/hive_backup_albums.model.dart';
import 'package:immich_mobile/modules/backup/models/hive_duplicated_assets.model.dart';
import 'package:immich_mobile/modules/login/models/hive_saved_login_info.model.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/models/immich_logger_message.model.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/services/asset_cache.service.dart';
import 'package:immich_mobile/utils/db.dart';
import 'package:isar/isar.dart';

Future<void> migrateHiveToStoreIfNecessary() async {
  await _migrateHiveBoxIfNecessary(userInfoBox, _migrateHiveUserInfoBox);
  await _migrateHiveBoxIfNecessary(
    backgroundBackupInfoBox,
    _migrateHiveBackgroundBackupInfoBox,
  );
  await _migrateHiveBoxIfNecessary(hiveBackupInfoBox, _migrateBackupInfoBox);
  await _migrateHiveBoxIfNecessary(
    duplicatedAssetsBox,
    _migrateDuplicatedAssetsBox,
  );
  await _migrateHiveBoxIfNecessary(
    hiveGithubReleaseInfoBox,
    _migrateReleaseInfoBox,
  );

  await _migrateHiveBoxIfNecessary(hiveLoginInfoBox, _migrateLoginInfoBox);
  await _migrateHiveBoxIfNecessary(
    immichLoggerBox,
    (Box<ImmichLoggerMessage> box) => box.deleteFromDisk(),
  );
  await _migrateHiveBoxIfNecessary(userSettingInfoBox, _migrateAppSettingsBox);
}

FutureOr<void> _migrateReleaseInfoBox(Box box) =>
    _migrateKey(box, githubReleaseInfoKey, StoreKey.githubReleaseInfo);

Future<void> _migrateLoginInfoBox(Box<HiveSavedLoginInfo> box) async {
  final HiveSavedLoginInfo? info = box.get(savedLoginInfoKey);
  if (info != null) {
    await Store.put(StoreKey.serverUrl, info.serverUrl);
    await Store.put(StoreKey.accessToken, info.accessToken);
  }
}

Future<void> _migrateHiveUserInfoBox(Box box) async {
  await _migrateKey(box, assetEtagKey, StoreKey.assetETag);
  if (Store.tryGet(StoreKey.deviceId) == null) {
    await _migrateKey(box, deviceIdKey, StoreKey.deviceId);
  }
  await _migrateKey(box, serverEndpointKey, StoreKey.serverEndpoint);
}

Future<void> _migrateHiveBackgroundBackupInfoBox(Box box) async {
  await _migrateKey(box, backupFailedSince, StoreKey.backupFailedSince);
  await _migrateKey(box, backupRequireWifi, StoreKey.backupRequireWifi);
  await _migrateKey(box, backupRequireCharging, StoreKey.backupRequireCharging);
  await _migrateKey(box, backupTriggerDelay, StoreKey.backupTriggerDelay);
}

FutureOr<void> _migrateBackupInfoBox(Box<HiveBackupAlbums> box) {
  final HiveBackupAlbums? infos = box.get(backupInfoKey);
  if (infos != null) {
    final Isar? db = Isar.getInstance();
    if (db == null) {
      throw Exception("_migrateBackupInfoBox could not load database");
    }
    List<BackupAlbum> albums = [];
    for (int i = 0; i < infos.selectedAlbumIds.length; i++) {
      final album = BackupAlbum(
        infos.selectedAlbumIds[i],
        infos.lastSelectedBackupTime[i],
        BackupSelection.select,
      );
      albums.add(album);
    }
    for (int i = 0; i < infos.excludedAlbumsIds.length; i++) {
      final album = BackupAlbum(
        infos.excludedAlbumsIds[i],
        infos.lastExcludedBackupTime[i],
        BackupSelection.exclude,
      );
      albums.add(album);
    }
    return db.writeTxn(() => db.backupAlbums.putAll(albums));
  }
}

FutureOr<void> _migrateDuplicatedAssetsBox(Box<HiveDuplicatedAssets> box) {
  final HiveDuplicatedAssets? duplicatedAssets = box.get(duplicatedAssetsKey);
  if (duplicatedAssets != null) {
    final Isar? db = Isar.getInstance();
    if (db == null) {
      throw Exception("_migrateBackupInfoBox could not load database");
    }
    final duplicatedAssetIds = duplicatedAssets.duplicatedAssetIds
        .map((id) => DuplicatedAsset(id))
        .toList();
    return db.writeTxn(() => db.duplicatedAssets.putAll(duplicatedAssetIds));
  }
}

Future<void> _migrateAppSettingsBox(Box box) async {
  for (AppSettingsEnum s in AppSettingsEnum.values) {
    await _migrateKey(box, s.hiveKey, s.storeKey);
  }
}

Future<void> _migrateHiveBoxIfNecessary<T>(
  String boxName,
  FutureOr<void> Function(Box<T>) migrate,
) async {
  try {
    if (await Hive.boxExists(boxName)) {
      final box = await Hive.openBox<T>(boxName);
      await migrate(box);
      await box.deleteFromDisk();
    }
  } catch (e) {
    debugPrint("Error while migrating $boxName $e");
  }
}

FutureOr<void> _migrateKey<T>(Box box, String hiveKey, StoreKey<T> key) {
  final T? value = box.get(hiveKey);
  if (value != null) {
    return Store.put(key, value);
  }
}

Future<void> migrateJsonCacheIfNecessary() async {
  await AlbumCacheService().invalidate();
  await SharedAlbumCacheService().invalidate();
  await AssetCacheService().invalidate();
}

Future<void> migrateDatabaseIfNeeded(Isar db) async {
  final int version = Store.get(StoreKey.version, 1);
  switch (version) {
    case 1:
      await _migrateV1ToV2(db);
  }
}

Future<void> _migrateV1ToV2(Isar db) async {
  await clearAssetsAndAlbums(db);
  await Store.put(StoreKey.version, 2);
}
