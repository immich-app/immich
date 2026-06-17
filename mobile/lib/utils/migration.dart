import 'dart:async';
import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/constants/colors.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/app_metadata_key.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/models/session.model.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/app_metadata.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/session.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/settings.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/app_metadata.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/network.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/session.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/models/auth/auxilary_endpoint.model.dart';
import 'package:immich_mobile/providers/album/album_sort_by_options.provider.dart';

Future<void> migrateDatabaseIfNeeded(Drift drift) async {
  final metadataRepository = AppMetadataRepository(drift);

  final int version = await metadataRepository.get(AppMetadataKey.version);

  if (version < 25) {
    await _migrateTo25();
  }

  if (version < 26) {
    await _migrateTo26(drift);
  }

  if (version < 27) {
    await _migrateTo27(drift);
  }

  if (version < 28) {
    await _migrateTo28(drift);
  }

  if (version < 29) {
    await _migrateTo29(drift);
  }

  await metadataRepository.set(AppMetadataKey.version, kCurrentVersion);
  return;
}

Future<void> _migrateTo25() async {
  final accessToken = Store.tryGet(.legacyAccessToken);
  if (accessToken == null || accessToken.isEmpty) {
    return;
  }

  final urls = <String>[];
  final serverEndpoint = Store.tryGet(.legacyServerEndpoint);
  if (serverEndpoint != null && serverEndpoint.isNotEmpty) {
    urls.add(serverEndpoint);
  }
  final localEndpoint = Store.tryGet(.legacyLocalEndpoint);
  if (localEndpoint != null && localEndpoint.isNotEmpty) {
    urls.add(localEndpoint);
  }
  final externalJson = Store.tryGet(.legacyExternalEndpointList);
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

  final customHeadersStr = Store.get(.legacyCustomHeaders, "");
  final headers = customHeadersStr.isEmpty
      ? const <String, String>{}
      : (jsonDecode(customHeadersStr) as Map).cast<String, String>();

  await NetworkRepository.setHeaders(headers, urls, token: accessToken);
}

Future<void> _migrateTo26(Drift drift) async {
  final migrator = _StoreMigrator.settings(drift);
  await migrator.migrateEnumIndex(.legacyLogLevel, .logLevel, LogLevel.values);
  // Theme
  await migrator.migrateEnumName(.legacyThemeMode, .themeMode, ThemeMode.values);
  await migrator.migrateEnumName(.legacyPrimaryColor, .themePrimaryColor, ImmichColorPreset.values);
  await migrator.migrateBool(.legacyDynamicTheme, .themeDynamic);
  await migrator.migrateBool(.legacyColorfulInterface, .themeColorfulInterface);
  // Cleanup
  final cleanupKeepAlbumIds = await migrator.readLegacyStoreString(.legacyCleanupKeepAlbumIds);
  if (cleanupKeepAlbumIds != null) {
    final ids = cleanupKeepAlbumIds.split(',').where((id) => id.isNotEmpty).toList();
    migrator.stage(.legacyCleanupKeepAlbumIds, .cleanupKeepAlbumIds, ids);
  }
  await migrator.migrateBool(.legacyCleanupKeepFavorites, .cleanupKeepFavorites);
  await migrator.migrateEnumIndex(.legacyCleanupKeepMediaType, .cleanupKeepMediaType, AssetKeepType.values);
  await migrator.migrateInt(.legacyCleanupCutoffDaysAgo, .cleanupCutoffDaysAgo);
  await migrator.migrateBool(.legacyCleanupDefaultsInitialized, .cleanupDefaultsInitialized);
  // Map
  await migrator.migrateBool(.legacyMapShowFavoriteOnly, .mapShowFavoriteOnly);
  await migrator.migrateInt(.legacyMapRelativeDate, .mapRelativeDate);
  await migrator.migrateBool(.legacyMapIncludeArchived, .mapIncludeArchived);
  await migrator.migrateEnumIndex(.legacyMapThemeMode, .mapThemeMode, ThemeMode.values);
  await migrator.migrateBool(.legacyMapwithPartners, .mapWithPartners);
  // Timeline
  await migrator.migrateInt(.legacyTilesPerRow, .timelineTilesPerRow);
  await migrator.migrateEnumIndex(.legacyGroupAssetsBy, .timelineGroupAssetsBy, GroupAssetsBy.values);
  await migrator.migrateBool(.legacyStorageIndicator, .timelineStorageIndicator);
  // Image
  await migrator.migrateBool(.legacyPreferRemoteImage, .imagePreferRemote);
  await migrator.migrateBool(.legacyLoadOriginal, .imageLoadOriginal);
  // Viewer
  await migrator.migrateBool(.legacyLoopVideo, .viewerLoopVideo);
  await migrator.migrateBool(.legacyLoadOriginalVideo, .viewerLoadOriginalVideo);
  await migrator.migrateBool(.legacyAutoPlayVideo, .viewerAutoPlayVideo);
  await migrator.migrateBool(.legacyTapToNavigate, .viewerTapToNavigate);
  // Network
  await migrator.migrateBool(.legacyAutoEndpointSwitching, .networkAutoEndpointSwitching);
  final preferredWifiName = await migrator.readLegacyStoreString(.legacyPreferredWifiName);
  migrator.stage(.legacyPreferredWifiName, .networkPreferredWifiName, preferredWifiName);
  final localEndpoint = await migrator.readLegacyStoreString(.legacyLocalEndpoint);
  migrator.stage(.legacyLocalEndpoint, .networkLocalEndpoint, localEndpoint);
  await _migrateExternalEndpointList(migrator);
  await _migrateCustomHeaders(migrator);
  // Album
  await _migrateAlbumSortMode(migrator);
  await migrator.migrateBool(.legacySelectedAlbumSortReverse, .albumIsReverse);
  await migrator.migrateBool(.legacyAlbumGridView, .albumIsGrid);
  // Backup
  await migrator.migrateBool(.legacyEnableBackup, .backupEnabled);
  await migrator.migrateBool(.legacyUseWifiForUploadVideos, .backupUseCellularForVideos);
  await migrator.migrateBool(.legacyUseWifiForUploadPhotos, .backupUseCellularForPhotos);
  await migrator.migrateBool(.legacyBackupRequireCharging, .backupRequireCharging);
  await migrator.migrateInt(.legacyBackupTriggerDelay, .backupTriggerDelay);
  await migrator.migrateBool(.legacySyncAlbums, .backupSyncAlbums);
  await migrator.complete();
}

Future<void> _migrateTo27(Drift drift) async {
  final migrator = _StoreMigrator.session(drift);
  await migrator.migrateString(.legacyServerUrl, .serverUrl);
  await migrator.migrateString(.legacyAccessToken, .accessToken);
  await migrator.migrateString(.legacyServerEndpoint, .serverEndpoint);
  await migrator.complete();

  await SessionRepository.instance.refresh();
}

Future<void> _migrateTo28(Drift drift) async {
  final migrator = _StoreMigrator.settings(drift);
  await migrator.migrateBool(.legacyAdvancedTroubleshooting, .advancedTroubleshooting);
  await migrator.migrateBool(.legacyEnableHapticFeedback, .advancedEnableHapticFeedback);
  await migrator.migrateBool(.legacyReadonlyModeEnabled, .advancedReadonlyModeEnabled);
  await migrator.complete();

  await SettingsRepository.instance.refresh();
}

Future<void> _migrateTo29(Drift drift) async {
  final migrator = _StoreMigrator.appMetadata(drift);

  final rawStatus = await migrator.readLegacyStoreString(.legacySyncMigrationStatus);
  if (rawStatus != null) {
    final decoded = jsonDecode(rawStatus);
    final migrations = decoded is List ? decoded.whereType<String>().toList() : <String>[];
    migrator.stage(.legacySyncMigrationStatus, .syncMigrationStatus, migrations);
  }

  await migrator.migrateBool(.legacyManageLocalMediaAndroid, .manageLocalMediaAndroid);
  await migrator.complete();
}

Future<void> _migrateAlbumSortMode(_StoreMigrator<SettingsKey> migrator) async {
  final raw = await migrator.readLegacyStoreInt(.legacySelectedAlbumSortOrder);
  final mode = AlbumSortMode.values.firstWhereOrNull((e) => raw != null && e.storeIndex == raw);
  if (mode == null) {
    return;
  }

  migrator.stage(.legacySelectedAlbumSortOrder, .albumSortMode, mode);
}

Future<void> _migrateExternalEndpointList(_StoreMigrator<SettingsKey> migrator) async {
  final raw = await migrator.readLegacyStoreString(.legacyExternalEndpointList);
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

Future<void> _migrateCustomHeaders(_StoreMigrator<SettingsKey> migrator) async {
  final raw = await migrator.readLegacyStoreString(.legacyCustomHeaders);
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

class _StoreMigrator<K extends Enum> {
  _StoreMigrator._(this._db, {required this.encode, required this.readDefault, required this.insertRow});

  static _StoreMigrator<SettingsKey> settings(Drift db) => _StoreMigrator<SettingsKey>._(
    db,
    encode: (key, value) => key.encode(value),
    readDefault: (key) => defaultConfig.read(key),
    insertRow: (batch, name, value) => batch.insert(
      db.settingsEntity,
      SettingsEntityCompanion(key: Value(name), value: Value(value)),
      mode: InsertMode.insertOrReplace,
    ),
  );

  static _StoreMigrator<SessionKey> session(Drift db) => _StoreMigrator<SessionKey>._(
    db,
    encode: (key, value) => key.encode(value),
    readDefault: (key) => defaultSession.read(key),
    insertRow: (batch, name, value) => batch.insert(
      db.sessionEntity,
      SessionEntityCompanion(key: Value(name), value: Value(value)),
      mode: InsertMode.insertOrReplace,
    ),
  );

  static _StoreMigrator<AppMetadataKey> appMetadata(Drift db) => _StoreMigrator<AppMetadataKey>._(
    db,
    encode: (key, value) => key.encode(value),
    readDefault: (_) => null,
    insertRow: (batch, name, value) => batch.insert(
      db.appMetadataEntity,
      AppMetadataEntityCompanion(key: Value(name), value: Value(value)),
      mode: InsertMode.insertOrReplace,
    ),
  );

  final Drift _db;
  final String Function(K key, Object value) encode;
  final Object? Function(K key) readDefault;
  final void Function(Batch batch, String name, String? value) insertRow;
  final Map<K, Object?> _cache = {};
  final List<int> _migratedStoreIds = [];

  Future<void> migrateEnumIndex<T extends Enum>(StoreKey<int> legacyKey, K newKey, List<T> values) async {
    final index = await readLegacyStoreInt(legacyKey);
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

  Future<void> migrateEnumName<T extends Enum>(StoreKey<String> legacyKey, K newKey, List<T> values) async {
    final name = await readLegacyStoreString(legacyKey);
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

  Future<void> migrateBool(StoreKey<bool> legacyKey, K newKey) async {
    final intValue = await readLegacyStoreInt(legacyKey);
    if (intValue == null) {
      return;
    }

    _cache[newKey] = intValue != 0;
    _migratedStoreIds.add(legacyKey.id);
  }

  Future<void> migrateInt(StoreKey<int> legacyKey, K newKey) async {
    final intValue = await readLegacyStoreInt(legacyKey);
    if (intValue == null) {
      return;
    }

    _cache[newKey] = intValue;
    _migratedStoreIds.add(legacyKey.id);
  }

  Future<void> migrateString(StoreKey<String> legacyKey, K newKey) async {
    final value = await readLegacyStoreString(legacyKey);
    if (value == null || value.isEmpty) {
      return;
    }

    _cache[newKey] = value;
    _migratedStoreIds.add(legacyKey.id);
  }

  Future<void> migrateNullableString(StoreKey<String> legacyKey, K newKey) async {
    _cache[newKey] = await readLegacyStoreString(legacyKey);
    _migratedStoreIds.add(legacyKey.id);
  }

  void stage(StoreKey legacyKey, K newKey, Object? value) {
    _cache[newKey] = value;
    _migratedStoreIds.add(legacyKey.id);
  }

  Future<void> complete() async {
    await _db.batch((batch) {
      for (final entry in _cache.entries) {
        if (entry.value == readDefault(entry.key)) {
          continue;
        }

        final value = entry.value;
        insertRow(batch, entry.key.name, value == null ? null : encode(entry.key, value));
      }
    });
    await deleteLegacyStoreRows(_migratedStoreIds);
  }

  Future<String?> readLegacyStoreString(StoreKey key) async {
    final row = await (_db.storeEntity.select()..where((t) => t.id.equals(key.id))).getSingleOrNull();
    return row?.stringValue;
  }

  Future<int?> readLegacyStoreInt(StoreKey key) async {
    final row = await (_db.storeEntity.select()..where((t) => t.id.equals(key.id))).getSingleOrNull();
    return row?.intValue;
  }

  Future<void> deleteLegacyStoreRows(List<int> ids) async {
    if (ids.isEmpty) {
      return;
    }
    await (_db.storeEntity.delete()..where((t) => t.id.isIn(ids))).go();
  }
}
