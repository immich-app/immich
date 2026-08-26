import 'dart:convert';
import 'dart:io';

import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/domain/services/log.service.dart';

class TroubleshootService {
  const TroubleshootService(this._logService);

  final LogService _logService;

  static Map<String, String?> configJson(AppConfig config) => {
    for (final key in SettingsKey.values)
      if (!key.sensitive)
        key.name: switch (config.read(key)) {
          null => null,
          final Object value => key.encode(value),
        },
  };

  Future<List<File>> buildBundle(
    Directory dir, {
    required AppConfig config,
    required bool includeLogs,
    required bool includeConfig,
    required void Function(double) onProgress,
  }) async {
    final parts = <File>[];
    final steps = [includeLogs, includeConfig].where((include) => include).length;
    var completed = 0;

    void reportProgress() => onProgress(++completed / steps);

    if (includeLogs) {
      parts.add(await _writeLogs('${dir.path}/immich.log'));
      reportProgress();
    }
    if (includeConfig) {
      final configFile = File('${dir.path}/app_config.json');
      await configFile.writeAsString(const JsonEncoder.withIndent('  ').convert(configJson(config)));
      parts.add(configFile);
      reportProgress();
    }
    return parts;
  }

  Future<File> _writeLogs(String path) async {
    final logFile = File(path);
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
