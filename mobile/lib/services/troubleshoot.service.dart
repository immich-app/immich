import 'dart:convert';
import 'dart:io';
import 'dart:isolate';

import 'package:archive/archive_io.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class TroubleshootService {
  const TroubleshootService(this._db, this._logService);

  final Drift _db;
  final LogService _logService;

  static const excludedConfigKeys = {
    SettingsKey.networkLocalEndpoint,
    SettingsKey.networkExternalEndpointList,
    SettingsKey.networkCustomHeaders,
    SettingsKey.networkPreferredWifiName,
  };

  static Map<String, String?> configJson(AppConfig config) => {
    for (final key in SettingsKey.values)
      if (!excludedConfigKeys.contains(key))
        key.name: switch (config.read(key)) {
          null => null,
          final Object value => key.encode(value),
        },
  };

  Future<File> buildBundle(
    Directory dir, {
    required AppConfig config,
    required bool includeLogs,
    required bool includeDatabase,
    required bool includeConfig,
  }) async {
    final parts = <File>[];
    if (includeLogs) {
      parts.add(await _writeLogs('${dir.path}/immich.log'));
    }
    if (includeDatabase) {
      final dbCopy = '${dir.path}/immich.sqlite';
      // copying the file directly would miss pending wal writes
      await _db.customStatement('VACUUM INTO ?', [dbCopy]);
      parts.add(File(dbCopy));
    }
    if (includeConfig) {
      final configFile = File('${dir.path}/app_config.json');
      await configFile.writeAsString(const JsonEncoder.withIndent('  ').convert(configJson(config)));
      parts.add(configFile);
    }

    final zip = File('${dir.path}/immich_troubleshoot_${DateTime.now().millisecondsSinceEpoch}.zip');
    final zipPath = zip.path;
    final partPaths = [for (final part in parts) part.path];
    // the zip encoder compresses synchronously
    await Isolate.run(() async {
      final encoder = ZipFileEncoder()..create(zipPath);
      for (final path in partPaths) {
        await encoder.addFile(File(path));
      }
      await encoder.close();
    });
    for (final part in parts) {
      await part.delete();
    }
    return zip;
  }

  Future<File> _writeLogs(String path) async {
    final logFile = await File(path).create();
    final io = logFile.openWrite();
    try {
      for (final m in await _logService.getMessages()) {
        final created = m.createdAt;
        final level = m.level.name.padRight(8);
        final logger = (m.logger ?? "<UNKNOWN_LOGGER>").padRight(20);
        final message = m.message;
        final error = m.error == null ? "" : " ${m.error} |";
        final stack = m.stack == null ? "" : "\n${m.stack!}";
        io.write('$created | $level | $logger | $message |$error$stack\n');
      }
    } finally {
      await io.flush();
      await io.close();
    }
    return logFile;
  }
}
