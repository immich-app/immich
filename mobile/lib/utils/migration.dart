import 'dart:async';

import 'package:drift/drift.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/models/metadata_key.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/metadata.repository.dart';
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
  final repo = MetadataRepository.instance;
  final migrated = <int>[];

  final themeMode = await _readLegacyStoreString(drift, StoreKey.legacyThemeMode.id);
  if (themeMode != null) {
    final mode = ThemeMode.values.firstWhere((m) => m.name == themeMode, orElse: () => ThemeMode.system);
    await repo.write(MetadataKey.themeMode, mode);
    migrated.add(StoreKey.legacyThemeMode.id);
  }

  final logLevelIndex = await _readLegacyStoreInt(drift, StoreKey.legacyLogLevel.id);
  if (logLevelIndex != null) {
    final logLevel = LogLevel.values.elementAtOrNull(logLevelIndex) ?? LogLevel.info;
    await LogService.I.setLogLevel(logLevel);
    migrated.add(StoreKey.legacyLogLevel.id);
  }

  await _deleteLegacyStoreRows(drift, migrated);
}

Future<String?> _readLegacyStoreString(Drift drift, int id) async {
  final row = await (drift.storeEntity.select()..where((t) => t.id.equals(id))).getSingleOrNull();
  return row?.stringValue;
}

Future<int?> _readLegacyStoreInt(Drift drift, int id) async {
  final row = await (drift.storeEntity.select()..where((t) => t.id.equals(id))).getSingleOrNull();
  return row?.intValue;
}

Future<void> _deleteLegacyStoreRows(Drift drift, List<int> ids) async {
  if (ids.isEmpty) return;
  await (drift.storeEntity.delete()..where((t) => t.id.isIn(ids))).go();
}
