// ignore_for_file: avoid-unsafe-collection-methods

import 'dart:async';
import 'dart:io';

import 'package:flutter/widgets.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/android_device_asset.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/etag.entity.dart';
import 'package:immich_mobile/entities/ios_device_asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/device_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.dart';
import 'package:immich_mobile/infrastructure/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/utils/diff.dart';
import 'package:isar/isar.dart';
import 'package:photo_manager/photo_manager.dart'; // Added import

const int targetVersion = 10;

Future<void> migrateDatabaseIfNeeded(Isar db) async {
  final int version = Store.get(StoreKey.version, targetVersion);

  if (version < 9) {
    await Store.put(StoreKey.version, targetVersion);
    final value = await db.storeValues.get(StoreKey.currentUser.id);
    if (value != null) {
      final id = value.intValue;
      if (id != null) {
        await db.writeTxn(() async {
          final user = await db.users.get(id);
          await db.storeValues
              .put(StoreValue(StoreKey.currentUser.id, strValue: user?.id));
        });
      }
    }
  }

  if (version < 10) {
    await Store.put(StoreKey.version, targetVersion);
    await _migrateDeviceAsset(db);
  }

  final shouldTruncate = version < 8 && version < targetVersion;
  if (shouldTruncate) {
    await _migrateTo(db, targetVersion);
  }
}

Future<void> _migrateTo(Isar db, int version) async {
  await Store.delete(StoreKey.assetETag);
  await db.writeTxn(() async {
    await db.assets.clear();
    await db.exifInfos.clear();
    await db.albums.clear();
    await db.eTags.clear();
    await db.users.clear();
  });
  await Store.put(StoreKey.version, version);
}

Future<void> _migrateDeviceAsset(Isar db) async {
  final ids = Platform.isAndroid
      ? (await db.androidDeviceAssets.where().findAll())
          .map((a) => _DeviceAsset(assetId: a.id.toString(), hash: a.hash))
          .toList()
      : (await db.iOSDeviceAssets.where().findAll())
          .map((i) => _DeviceAsset(assetId: i.id, hash: i.hash))
          .toList();

  final PermissionState ps = await PhotoManager.requestPermissionExtend();
  if (!ps.hasAccess) {
    debugPrint(
      "[MIGRATION] Photo library permission not granted. Skipping device asset migration.",
    );
    return;
  }

  // Get the main album (usually "Recents" or "All Photos")
  final List<AssetPathEntity> paths =
      await PhotoManager.getAssetPathList(onlyAll: true);
  if (paths.isEmpty) {
    return;
  }
  final AssetPathEntity albumWithAll = paths.first;
  final int assetCount = await albumWithAll.assetCountAsync;

  final List<AssetEntity> allDeviceAssets =
      await albumWithAll.getAssetListRange(start: 0, end: assetCount);

  final localAssets = allDeviceAssets
      .map((a) => _DeviceAsset(assetId: a.id, dateTime: a.modifiedDateTime))
      .toList();

  debugPrint("[MIGRATION] Device Asset Ids length - ${ids.length}");
  debugPrint("[MIGRATION] Local Asset Ids length - ${localAssets.length}");
  ids.sort((a, b) => a.assetId.compareTo(b.assetId));
  localAssets.sort((a, b) => a.assetId.compareTo(b.assetId));
  final List<DeviceAssetEntity> toAdd = [];
  await diffSortedLists(
    ids,
    localAssets,
    compare: (a, b) => a.assetId.compareTo(b.assetId),
    both: (deviceAsset, asset) {
      toAdd.add(
        DeviceAssetEntity(
          assetId: deviceAsset.assetId,
          hash: deviceAsset.hash!,
          modifiedTime: asset.dateTime!,
        ),
      );
      return false;
    },
    onlyFirst: (deviceAsset) {
      debugPrint(
        '[MIGRATION] DeviceAsset not found in local assets: ${deviceAsset.assetId}',
      );
    },
    onlySecond: (asset) {
      debugPrint(
        '[MIGRATION] Local asset not found in DeviceAsset: ${asset.assetId}',
      );
    },
  );
  debugPrint(
    "[MIGRATION] Total number of device assets migrated - ${toAdd.length}",
  );
  await db.writeTxn(() async {
    await db.deviceAssetEntitys.putAll(toAdd);
  });
}

class _DeviceAsset {
  final String assetId;
  final List<int>? hash;
  final DateTime? dateTime;

  const _DeviceAsset({required this.assetId, this.hash, this.dateTime});
}
