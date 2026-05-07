import 'dart:async';

import 'package:drift/drift.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/constants/colors.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/models/metadata_key.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/metadata.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/network.repository.dart';
import 'package:immich_mobile/services/api.service.dart';

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
  if (accessToken == null || accessToken.isEmpty) return;

  final serverUrls = ApiService.getServerUrls();
  if (serverUrls.isEmpty) return;

  await NetworkRepository.setHeaders(ApiService.getRequestHeaders(), serverUrls, token: accessToken);
}

Future<void> _migrateTo26(Drift drift) async {
  final migrator = _StoreMigrator(drift);
  await migrator.migrateEnumName(StoreKey.legacyThemeMode, MetadataKey.themeMode, ThemeMode.values);
  await migrator.migrateEnumIndex(StoreKey.legacyLogLevel, MetadataKey.logLevel, LogLevel.values);
  await migrator.migrateEnumName(StoreKey.legacyPrimaryColor, MetadataKey.primaryColor, ImmichColorPreset.values);
  await migrator.migrateBool(StoreKey.legacyDynamicTheme, MetadataKey.dynamicTheme);
  await migrator.migrateBool(StoreKey.legacyColorfulInterface, MetadataKey.colorfulInterface);
  await migrator.complete();
}

class _StoreMigrator {
  final Drift _db;
  final Map<MetadataKey<Object>, Object> _cache = {};
  final List<int> _migratedStoreIds = [];

  _StoreMigrator(this._db);

  Future<void> migrateEnumIndex<T extends Enum>(StoreKey<int> legacyKey, MetadataKey<T> newKey, List<T> values) async {
    final index = await _readLegacyStoreInt(legacyKey.id);
    if (index == null) return;

    final enumValue = values.elementAtOrNull(index) ?? newKey.defaultValue;
    _cache[newKey] = enumValue;
    _migratedStoreIds.add(legacyKey.id);
  }

  Future<void> migrateEnumName<T extends Enum>(
    StoreKey<String> legacyKey,
    MetadataKey<T> newKey,
    List<T> values,
  ) async {
    final name = await _readLegacyStoreString(legacyKey.id);
    if (name == null) return;

    final enumValue = values.firstWhere((e) => e.name == name, orElse: () => newKey.defaultValue);
    _cache[newKey] = enumValue;
    _migratedStoreIds.add(legacyKey.id);
  }

  Future<void> migrateBool(StoreKey<bool> legacyKey, MetadataKey<bool> newKey) async {
    final intValue = await _readLegacyStoreInt(legacyKey.id);
    if (intValue == null) return;

    final boolValue = intValue != 0;
    _cache[newKey] = boolValue;
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
    await _deleteLegacyStoreRows(_migratedStoreIds);
  }

  Future<String?> _readLegacyStoreString(int id) async {
    final row = await (_db.storeEntity.select()..where((t) => t.id.equals(id))).getSingleOrNull();
    return row?.stringValue;
  }

  Future<int?> _readLegacyStoreInt(int id) async {
    final row = await (_db.storeEntity.select()..where((t) => t.id.equals(id))).getSingleOrNull();
    return row?.intValue;
  }

  Future<void> _deleteLegacyStoreRows(List<int> ids) async {
    if (ids.isEmpty) return;
    await (_db.storeEntity.delete()..where((t) => t.id.isIn(ids))).go();
  }
}
