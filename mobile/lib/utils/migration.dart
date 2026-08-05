import 'dart:async';
import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/constants/colors.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/feature_message.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/settings.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/network.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/models/auth/auxilary_endpoint.model.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/platform/permission_api.g.dart';
import 'package:immich_mobile/providers/album/album_sort_by_options.provider.dart';
import 'package:immich_mobile/utils/datetime_helpers.dart';

const int targetVersion = 27;

Future<void> migrateDatabaseIfNeeded(Drift drift, NativeSyncApi nativeSyncApi, PermissionApi permissionApi) async {
  final int? storedVersion = Store.tryGet(StoreKey.version);
  final version = storedVersion ?? targetVersion;

  if (version < 25) {
    await _migrateTo25();
  }

  if (version < 26) {
    await _migrateTo26(drift);
  }

  if (version < 27 && !await _migrateTo27(drift, nativeSyncApi, permissionApi)) {
    await Store.put(StoreKey.version, 26);
    return;
  }

  if (storedVersion == null) {
    await FeatureMessageService(SettingsRepository.instance).markSeen();
  }

  await Store.put(StoreKey.version, targetVersion);
  return;
}

Future<bool> _migrateTo27(Drift drift, NativeSyncApi nativeSyncApi, PermissionApi permissionApi) async {
  if (!CurrentPlatform.isAndroid) {
    return true;
  }
  try {
    if (!await nativeSyncApi.hasMediaReadPermission()) {
      return false;
    }

    final dates = <String, DateTime>{};
    void addDates(Iterable<PlatformAsset> assets) {
      for (final asset in assets) {
        dates[asset.id] = tryFromSecondsSinceEpoch(asset.createdAt, isUtc: true) ?? DateTime.timestamp();
      }
    }

    for (final album in await nativeSyncApi.getAlbums()) {
      addDates(await nativeSyncApi.getAssetsForAlbum(album.id));
    }
    if (await permissionApi.hasManageMediaPermission()) {
      final trashed = await nativeSyncApi.getTrashedAssets();
      addDates(trashed.values.flattened);
    }

    await drift.transaction(() async {
      final localDates = {
        for (final row in await (drift.selectOnly(
          drift.localAssetEntity,
        )..addColumns([drift.localAssetEntity.id, drift.localAssetEntity.createdAt])).get())
          row.read(drift.localAssetEntity.id)!: row.read(drift.localAssetEntity.createdAt)!,
      };
      final trashedDates = {
        for (final row in await (drift.selectOnly(
          drift.trashedLocalAssetEntity,
        )..addColumns([drift.trashedLocalAssetEntity.id, drift.trashedLocalAssetEntity.createdAt])).get())
          row.read(drift.trashedLocalAssetEntity.id)!: row.read(drift.trashedLocalAssetEntity.createdAt)!,
      };
      for (final chunk in dates.entries.slices(kDriftMaxChunk)) {
        await drift.batch((batch) {
          for (final entry in chunk) {
            final localDate = localDates[entry.key];
            if (localDate != null && !localDate.isAtSameMomentAs(entry.value)) {
              batch.update(
                drift.localAssetEntity,
                LocalAssetEntityCompanion(createdAt: Value(entry.value)),
                where: (row) => row.id.equals(entry.key),
              );
            }
            final trashedDate = trashedDates[entry.key];
            if (trashedDate != null && !trashedDate.isAtSameMomentAs(entry.value)) {
              batch.update(
                drift.trashedLocalAssetEntity,
                TrashedLocalAssetEntityCompanion(createdAt: Value(entry.value)),
                where: (row) => row.id.equals(entry.key),
              );
            }
          }
        });
      }
    });
    return true;
  } catch (_) {
    return false;
  }
}

Future<void> _migrateTo25() async {
  final accessToken = Store.tryGet(StoreKey.accessToken);
  if (accessToken == null || accessToken.isEmpty) {
    return;
  }

  final urls = <String>[];
  final serverEndpoint = Store.tryGet(StoreKey.serverEndpoint);
  if (serverEndpoint != null && serverEndpoint.isNotEmpty) {
    urls.add(serverEndpoint);
  }
  final localEndpoint = Store.tryGet(StoreKey.legacyLocalEndpoint);
  if (localEndpoint != null && localEndpoint.isNotEmpty) {
    urls.add(localEndpoint);
  }
  final externalJson = Store.tryGet(StoreKey.legacyExternalEndpointList);
  if (externalJson != null) {
    final List<dynamic> list = jsonDecode(externalJson);
    for (final entry in list) {
      final url = AuxilaryEndpoint.fromJson(entry).url;
      if (url.isNotEmpty) {
        urls.add(url);
      }
    }
  }
  if (urls.isEmpty) {
    return;
  }

  final customHeadersStr = Store.get(StoreKey.legacyCustomHeaders, "");
  final headers = customHeadersStr.isEmpty
      ? const <String, String>{}
      : (jsonDecode(customHeadersStr) as Map).cast<String, String>();

  await NetworkRepository.setHeaders(headers, urls, token: accessToken);
}

Future<void> _migrateTo26(Drift drift) async {
  final migrator = _StoreMigrator(drift);
  await migrator.migrateEnumIndex(StoreKey.legacyLogLevel, SettingsKey.logLevel, LogLevel.values);
  // Theme
  await migrator.migrateEnumName(StoreKey.legacyThemeMode, SettingsKey.themeMode, ThemeMode.values);
  await migrator.migrateEnumName(StoreKey.legacyPrimaryColor, SettingsKey.themePrimaryColor, ImmichColorPreset.values);
  await migrator.migrateBool(StoreKey.legacyDynamicTheme, SettingsKey.themeDynamic);
  await migrator.migrateBool(StoreKey.legacyColorfulInterface, SettingsKey.themeColorfulInterface);
  // Cleanup
  final cleanupKeepAlbumIds = await migrator.readLegacyStoreString(StoreKey.legacyCleanupKeepAlbumIds.id);
  if (cleanupKeepAlbumIds != null) {
    final ids = cleanupKeepAlbumIds.split(',').where((id) => id.isNotEmpty).toList();
    migrator.stage(StoreKey.legacyCleanupKeepAlbumIds, SettingsKey.cleanupKeepAlbumIds, ids);
  }
  await migrator.migrateBool(StoreKey.legacyCleanupKeepFavorites, SettingsKey.cleanupKeepFavorites);
  await migrator.migrateEnumIndex(
    StoreKey.legacyCleanupKeepMediaType,
    SettingsKey.cleanupKeepMediaType,
    AssetKeepType.values,
  );
  await migrator.migrateInt(StoreKey.legacyCleanupCutoffDaysAgo, SettingsKey.cleanupCutoffDaysAgo);
  await migrator.migrateBool(StoreKey.legacyCleanupDefaultsInitialized, SettingsKey.cleanupDefaultsInitialized);
  // Map
  await migrator.migrateBool(StoreKey.legacyMapShowFavoriteOnly, SettingsKey.mapShowFavoriteOnly);
  await migrator.migrateInt(StoreKey.legacyMapRelativeDate, SettingsKey.mapRelativeDate);
  await migrator.migrateBool(StoreKey.legacyMapIncludeArchived, SettingsKey.mapIncludeArchived);
  await migrator.migrateEnumIndex(StoreKey.legacyMapThemeMode, SettingsKey.mapThemeMode, ThemeMode.values);
  await migrator.migrateBool(StoreKey.legacyMapwithPartners, SettingsKey.mapWithPartners);
  // Timeline
  await migrator.migrateInt(StoreKey.legacyTilesPerRow, SettingsKey.timelineTilesPerRow);
  await migrator.migrateEnumIndex(
    StoreKey.legacyGroupAssetsBy,
    SettingsKey.timelineGroupAssetsBy,
    GroupAssetsBy.values,
  );
  await migrator.migrateBool(StoreKey.legacyStorageIndicator, SettingsKey.timelineStorageIndicator);
  // Image
  await migrator.migrateBool(StoreKey.legacyPreferRemoteImage, SettingsKey.imagePreferRemote);
  await migrator.migrateBool(StoreKey.legacyLoadOriginal, SettingsKey.imageLoadOriginal);
  // Viewer
  await migrator.migrateBool(StoreKey.legacyLoopVideo, SettingsKey.viewerLoopVideo);
  await migrator.migrateBool(StoreKey.legacyLoadOriginalVideo, SettingsKey.viewerLoadOriginalVideo);
  await migrator.migrateBool(StoreKey.legacyAutoPlayVideo, SettingsKey.viewerAutoPlayVideo);
  await migrator.migrateBool(StoreKey.legacyTapToNavigate, SettingsKey.viewerTapToNavigate);
  // Network
  await migrator.migrateBool(StoreKey.legacyAutoEndpointSwitching, SettingsKey.networkAutoEndpointSwitching);
  final preferredWifiName = await migrator.readLegacyStoreString(StoreKey.legacyPreferredWifiName.id);
  migrator.stage(StoreKey.legacyPreferredWifiName, SettingsKey.networkPreferredWifiName, preferredWifiName);
  final localEndpoint = await migrator.readLegacyStoreString(StoreKey.legacyLocalEndpoint.id);
  migrator.stage(StoreKey.legacyLocalEndpoint, SettingsKey.networkLocalEndpoint, localEndpoint);
  await _migrateExternalEndpointList(migrator);
  await _migrateCustomHeaders(migrator);
  // Album
  await _migrateAlbumSortMode(migrator);
  await migrator.migrateBool(StoreKey.legacySelectedAlbumSortReverse, SettingsKey.albumIsReverse);
  await migrator.migrateBool(StoreKey.legacyAlbumGridView, SettingsKey.albumIsGrid);
  // Backup
  await migrator.migrateBool(StoreKey.legacyEnableBackup, SettingsKey.backupEnabled);
  await migrator.migrateBool(StoreKey.legacyUseWifiForUploadVideos, SettingsKey.backupUseCellularForVideos);
  await migrator.migrateBool(StoreKey.legacyUseWifiForUploadPhotos, SettingsKey.backupUseCellularForPhotos);
  await migrator.migrateBool(StoreKey.legacyBackupRequireCharging, SettingsKey.backupRequireCharging);
  await migrator.migrateInt(StoreKey.legacyBackupTriggerDelay, SettingsKey.backupTriggerDelay);
  await migrator.migrateBool(StoreKey.legacySyncAlbums, SettingsKey.backupSyncAlbums);
  await migrator.complete();
}

Future<void> _migrateAlbumSortMode(_StoreMigrator migrator) async {
  final raw = await migrator.readLegacyStoreInt(StoreKey.legacySelectedAlbumSortOrder.id);
  final mode = AlbumSortMode.values.firstWhereOrNull((e) => raw != null && e.storeIndex == raw);
  if (mode == null) {
    return;
  }

  migrator.stage(StoreKey.legacySelectedAlbumSortOrder, SettingsKey.albumSortMode, mode);
}

Future<void> _migrateExternalEndpointList(_StoreMigrator migrator) async {
  final raw = await migrator.readLegacyStoreString(StoreKey.legacyExternalEndpointList.id);
  if (raw == null) {
    return;
  }

  final urls = <String>[];
  try {
    final decoded = jsonDecode(raw);
    if (decoded is List) {
      for (final entry in decoded) {
        final url = AuxilaryEndpoint.fromJson(entry).url;
        if (url.isNotEmpty) {
          urls.add(url);
        }
      }
    }
  } on FormatException {
    // ignore invalid entries
  }

  migrator.stage(StoreKey.legacyExternalEndpointList, SettingsKey.networkExternalEndpointList, urls);
}

Future<void> _migrateCustomHeaders(_StoreMigrator migrator) async {
  final raw = await migrator.readLegacyStoreString(StoreKey.legacyCustomHeaders.id);
  if (raw == null) {
    return;
  }

  final headers = <String, String>{};
  try {
    final decoded = jsonDecode(raw);
    if (decoded is Map) {
      decoded.forEach((key, value) {
        if (key is String && value is String) {
          headers[key] = value;
        }
      });
    }
  } on FormatException {
    // ignore invalid entries
  }

  migrator.stage(StoreKey.legacyCustomHeaders, SettingsKey.networkCustomHeaders, headers);
}

class _StoreMigrator {
  final Drift _db;
  final Map<SettingsKey, Object?> _cache = {};
  final List<int> _migratedStoreIds = [];

  _StoreMigrator(this._db);

  Future<void> migrateEnumIndex<T extends Enum>(StoreKey<int> legacyKey, SettingsKey<T> newKey, List<T> values) async {
    final index = await readLegacyStoreInt(legacyKey.id);
    if (index == null) {
      return;
    }

    final enumValue = values.elementAtOrNull(index);
    if (enumValue == null) {
      return;
    }

    _cache[newKey] = enumValue;
    _migratedStoreIds.add(legacyKey.id);
  }

  Future<void> migrateEnumName<T extends Enum>(
    StoreKey<String> legacyKey,
    SettingsKey<T> newKey,
    List<T> values,
  ) async {
    final name = await readLegacyStoreString(legacyKey.id);
    if (name == null) {
      return;
    }

    final enumValue = values.firstWhereOrNull((e) => e.name == name);
    if (enumValue == null) {
      return;
    }

    _cache[newKey] = enumValue;
    _migratedStoreIds.add(legacyKey.id);
  }

  Future<void> migrateBool(StoreKey<bool> legacyKey, SettingsKey<bool> newKey) async {
    final intValue = await readLegacyStoreInt(legacyKey.id);
    if (intValue == null) {
      return;
    }

    final boolValue = intValue != 0;
    _cache[newKey] = boolValue;
    _migratedStoreIds.add(legacyKey.id);
  }

  Future<void> migrateInt(StoreKey<int> legacyKey, SettingsKey<int> newKey) async {
    final intValue = await readLegacyStoreInt(legacyKey.id);
    if (intValue == null) {
      return;
    }

    _cache[newKey] = intValue;
    _migratedStoreIds.add(legacyKey.id);
  }

  Future<void> migrateString(StoreKey<String> legacyKey, SettingsKey<String> newKey) async {
    final value = await readLegacyStoreString(legacyKey.id);
    if (value == null) {
      return;
    }

    _cache[newKey] = value;
    _migratedStoreIds.add(legacyKey.id);
  }

  void stage<T, U extends T>(StoreKey legacyKey, SettingsKey<T> newKey, U value) {
    _cache[newKey] = value;
    _migratedStoreIds.add(legacyKey.id);
  }

  Future<void> complete() async {
    await _db.batch((batch) {
      for (final entry in _cache.entries) {
        if (entry.value == defaultConfig.read(entry.key)) {
          continue;
        }

        String? resolvedValue;
        if (entry.value != null) {
          resolvedValue = entry.key.encode(entry.value);
        }

        batch.insert(
          _db.settingsEntity,
          SettingsEntityCompanion(key: Value(entry.key.name), value: Value(resolvedValue)),
          mode: InsertMode.insertOrReplace,
        );
      }
    });
    await deleteLegacyStoreRows(_migratedStoreIds);
  }

  Future<String?> readLegacyStoreString(int id) async {
    final row = await (_db.storeEntity.select()..where((t) => t.id.equals(id))).getSingleOrNull();
    return row?.stringValue;
  }

  Future<int?> readLegacyStoreInt(int id) async {
    final row = await (_db.storeEntity.select()..where((t) => t.id.equals(id))).getSingleOrNull();
    return row?.intValue;
  }

  Future<void> deleteLegacyStoreRows(List<int> ids) async {
    if (ids.isEmpty) {
      return;
    }
    await (_db.storeEntity.delete()..where((t) => t.id.isIn(ids))).go();
  }
}
