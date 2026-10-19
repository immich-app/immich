import 'dart:async';
import 'dart:io';

import 'package:flutter/widgets.dart';
import 'package:immich_mobile/data/db/logger/database.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/infrastructure/repositories/log.repository.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

/// [ImmichLogger] is a custom logger that is built on top of the [logging] package.
/// The logs are written to the database and onto console, using `debugPrint` method.
///
/// The logs are deleted when exceeding the `maxLogEntries` (default 500) property
/// in the class.
///
/// Logs can be shared by calling the `shareLogs` method, which will open a share dialog
/// and generate a csv file.
abstract final class ImmichLogger {
  // the startup error screen can show before the log service starts, and then the startup error was not logged
  static Future<List<LogMessage>> _read(String? startupError) async {
    try {
      return await LogService.I.getMessages();
    } on LoggerUnInitializedException {
      final logs = DriftLogger.sqlite(await openSqliteConnection(name: 'immich_logs'));
      try {
        return [
          if (startupError != null)
            LogMessage(message: startupError, level: LogLevel.severe, createdAt: DateTime.now()),
          ...await LogRepository(logs).getAll(),
        ];
      } finally {
        await logs.close();
      }
    }
  }

  static Future<void> shareLogs(BuildContext context, {String? startupError}) async {
    final tempDir = await getTemporaryDirectory();
    final dateTime = DateTime.now().toIso8601String();
    final filePath = '${tempDir.path}/Immich_log_$dateTime.log';
    final logFile = await File(filePath).create();
    final io = logFile.openWrite();
    try {
      // Write messages
      for (final m in await _read(startupError)) {
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

    if (!context.mounted) {
      return;
    }

    final box = context.findRenderObject() as RenderBox?;

    // Share file
    await Share.shareXFiles(
      [XFile(filePath)],
      subject: "Immich logs $dateTime",
      sharePositionOrigin: box!.localToGlobal(Offset.zero) & box.size,
    ).then((value) => logFile.delete());
  }
}
