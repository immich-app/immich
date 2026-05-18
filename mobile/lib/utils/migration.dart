import 'dart:async';
import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/constants/colors.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/models/metadata_key.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/metadata.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/network.repository.dart';
import 'package:immich_mobile/models/auth/auxilary_endpoint.model.dart';
import 'package:immich_mobile/providers/album/album_sort_by_options.provider.dart';

const int targetVersion = 26;

Future<void> migrateDatabaseIfNeeded(Drift drift) async {
  final int version = Store.get(StoreKey.version, targetVersion);

  if (version < 25) {
    await _migrateTo25();
  }

  if (version < 26) {
    await _migrateTo26(drift);
  }

  await Store.put(StoreKey.version, targetVersion);
  return;
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
  await migrator.migrateEnumIndex(StoreKey.legacyLogLevel, MetadataKey.logLevel, LogLevel.values);
  // Theme
  await migrator.migrateEnumName(StoreKey.legacyThemeMode, MetadataKey.themeMode, ThemeMode.values);
  await migrator.migrateEnumName(StoreKey.legacyPrimaryColor, MetadataKey.themePrimaryColor, ImmichColorPreset.values);
  await migrator.migrateBool(StoreKey.legacyDynamicTheme, MetadataKey.themeDynamic);
  await migrator.migrateBool(StoreKey.legacyColorfulInterface, MetadataKey.themeColorfulInterface);
  // Cleanup
  final cleanupKeepAlbumIds = await migrator.readLegacyStoreString(StoreKey.legacyCleanupKeepAlbumIds.id);
  if (cleanupKeepAlbumIds != null) {
    final ids = cleanupKeepAlbumIds.split(',').where((id) => id.isNotEmpty).toList();
    migrator.stage(StoreKey.legacyCleanupKeepAlbumIds, MetadataKey.cleanupKeepAlbumIds, ids);
  }
  await migrator.migrateBool(StoreKey.legacyCleanupKeepFavorites, MetadataKey.cleanupKeepFavorites);
  await migrator.migrateEnumIndex(
    StoreKey.legacyCleanupKeepMediaType,
    MetadataKey.cleanupKeepMediaType,
    AssetKeepType.values,
  );
  await migrator.migrateInt(StoreKey.legacyCleanupCutoffDaysAgo, MetadataKey.cleanupCutoffDaysAgo);
  await migrator.migrateBool(StoreKey.legacyCleanupDefaultsInitialized, MetadataKey.cleanupDefaultsInitialized);
  // Map
  await migrator.migrateBool(StoreKey.legacyMapShowFavoriteOnly, MetadataKey.mapShowFavoriteOnly);
  await migrator.migrateInt(StoreKey.legacyMapRelativeDate, MetadataKey.mapRelativeDate);
  await migrator.migrateBool(StoreKey.legacyMapIncludeArchived, MetadataKey.mapIncludeArchived);
  await migrator.migrateEnumIndex(StoreKey.legacyMapThemeMode, MetadataKey.mapThemeMode, ThemeMode.values);
  await migrator.migrateBool(StoreKey.legacyMapwithPartners, MetadataKey.mapWithPartners);
  // Timeline
  await migrator.migrateInt(StoreKey.legacyTilesPerRow, MetadataKey.timelineTilesPerRow);
  await migrator.migrateEnumIndex(
    StoreKey.legacyGroupAssetsBy,
    MetadataKey.timelineGroupAssetsBy,
    GroupAssetsBy.values,
  );
  await migrator.migrateBool(StoreKey.legacyStorageIndicator, MetadataKey.timelineStorageIndicator);
  // Image
  await migrator.migrateBool(StoreKey.legacyPreferRemoteImage, MetadataKey.imagePreferRemote);
  await migrator.migrateBool(StoreKey.legacyLoadOriginal, MetadataKey.imageLoadOriginal);
  // Viewer
  await migrator.migrateBool(StoreKey.legacyLoopVideo, MetadataKey.viewerLoopVideo);
  await migrator.migrateBool(StoreKey.legacyLoadOriginalVideo, MetadataKey.viewerLoadOriginalVideo);
  await migrator.migrateBool(StoreKey.legacyAutoPlayVideo, MetadataKey.viewerAutoPlayVideo);
  await migrator.migrateBool(StoreKey.legacyTapToNavigate, MetadataKey.viewerTapToNavigate);
  // Network
  await migrator.migrateBool(StoreKey.legacyAutoEndpointSwitching, MetadataKey.networkAutoEndpointSwitching);
  await migrator.migrateString(StoreKey.legacyPreferredWifiName, MetadataKey.networkPreferredWifiName);
  await migrator.migrateString(StoreKey.legacyLocalEndpoint, MetadataKey.networkLocalEndpoint);
  await _migrateExternalEndpointList(migrator);
  await _migrateCustomHeaders(migrator);
  // Album
  await _migrateAlbumSortMode(migrator);
  await migrator.migrateBool(StoreKey.legacySelectedAlbumSortReverse, MetadataKey.albumIsReverse);
  await migrator.migrateBool(StoreKey.legacyAlbumGridView, MetadataKey.albumIsGrid);
  await migrator.complete();
}

Future<void> _migrateAlbumSortMode(_StoreMigrator migrator) async {
  final raw = await migrator.readLegacyStoreInt(StoreKey.legacySelectedAlbumSortOrder.id);
  if (raw == null) {
    return;
  }

  final mode = AlbumSortMode.values.firstWhere(
    (e) => e.storeIndex == raw,
    orElse: () => MetadataKey.albumSortMode.defaultValue,
  );

  migrator.stage(StoreKey.legacySelectedAlbumSortOrder, MetadataKey.albumSortMode, mode);
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

  migrator.stage(StoreKey.legacyExternalEndpointList, MetadataKey.networkExternalEndpointList, urls);
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

  migrator.stage(StoreKey.legacyCustomHeaders, MetadataKey.networkCustomHeaders, headers);
}

class _StoreMigrator {
  final Drift _db;
  final Map<MetadataKey<Object>, Object> _cache = {};
  final List<int> _migratedStoreIds = [];

  _StoreMigrator(this._db);

  Future<void> migrateEnumIndex<T extends Enum>(StoreKey<int> legacyKey, MetadataKey<T> newKey, List<T> values) async {
    final index = await readLegacyStoreInt(legacyKey.id);
    if (index == null) {
      return;
    }

    final enumValue = values.elementAtOrNull(index) ?? newKey.defaultValue;
    _cache[newKey] = enumValue;
    _migratedStoreIds.add(legacyKey.id);
  }

  Future<void> migrateEnumName<T extends Enum>(
    StoreKey<String> legacyKey,
    MetadataKey<T> newKey,
    List<T> values,
  ) async {
    final name = await readLegacyStoreString(legacyKey.id);
    if (name == null) {
      return;
    }

    final enumValue = values.firstWhere((e) => e.name == name, orElse: () => newKey.defaultValue);
    _cache[newKey] = enumValue;
    _migratedStoreIds.add(legacyKey.id);
  }

  Future<void> migrateBool(StoreKey<bool> legacyKey, MetadataKey<bool> newKey) async {
    final intValue = await readLegacyStoreInt(legacyKey.id);
    if (intValue == null) {
      return;
    }

    final boolValue = intValue != 0;
    _cache[newKey] = boolValue;
    _migratedStoreIds.add(legacyKey.id);
  }

  Future<void> migrateInt(StoreKey<int> legacyKey, MetadataKey<int> newKey) async {
    final intValue = await readLegacyStoreInt(legacyKey.id);
    if (intValue == null) {
      return;
    }

    _cache[newKey] = intValue;
    _migratedStoreIds.add(legacyKey.id);
  }

  Future<void> migrateString(StoreKey<String> legacyKey, MetadataKey<String> newKey) async {
    final value = await readLegacyStoreString(legacyKey.id);
    if (value == null) {
      return;
    }

    _cache[newKey] = value;
    _migratedStoreIds.add(legacyKey.id);
  }

  void stage<T extends Object>(StoreKey legacyKey, MetadataKey<T> newKey, T value) {
    _cache[newKey] = value;
    _migratedStoreIds.add(legacyKey.id);
  }

  Future<void> complete() async {
    await _db.batch((batch) {
      for (final entry in _cache.entries) {
        batch.insert(
          _db.metadataEntity,
          MetadataEntityCompanion(key: Value(entry.key.key), value: Value(entry.key.encode(entry.value))),
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
