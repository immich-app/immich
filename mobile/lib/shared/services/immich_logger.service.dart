import 'dart:io';

import 'package:flutter/widgets.dart';
import 'package:hive/hive.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/shared/models/immich_logger_message.model.dart';
import 'package:logging/logging.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

/// [ImmichLogger] is a custom logger that is built on top of the [logging] package.
/// The logs are written to a Hive box and onto console, using `debugPrint` method.
///
/// The logs are deleted when exceeding the `maxLogEntries` (default 200) property
/// in the class.
///
/// Logs can be shared by calling the `shareLogs` method, which will open a share dialog
/// and generate a csv file.
class ImmichLogger {
  final maxLogEntries = 200;
  final Box<ImmichLoggerMessage> _box = Hive.box(immichLoggerBox);

  List<ImmichLoggerMessage> get messages =>
      _box.values.toList().reversed.toList();

  ImmichLogger() {
    _removeOverflowMessages();
  }

  init() {
    Logger.root.level = Level.INFO;
    Logger.root.onRecord.listen(_writeLogToHiveBox);
  }

  _removeOverflowMessages() {
    if (_box.length > maxLogEntries) {
      var numberOfEntryToBeDeleted = _box.length - maxLogEntries;
      for (var i = 0; i < numberOfEntryToBeDeleted; i++) {
        _box.deleteAt(0);
      }
    }
  }

  _writeLogToHiveBox(LogRecord record) {
    final Box<ImmichLoggerMessage> box = Hive.box(immichLoggerBox);
    var formattedMessage = record.message;

    debugPrint('[${record.level.name}] [${record.time}] ${record.message}');
    box.add(
      ImmichLoggerMessage(
        message: formattedMessage,
        level: record.level.name,
        createdAt: record.time,
        context1: record.loggerName,
        context2: record.stackTrace?.toString(),
      ),
    );
  }

  void clearLogs() {
    _box.clear();
  }

  Future<void> shareLogs() async {
    final tempDir = await getTemporaryDirectory();
    final dateTime = DateTime.now().toIso8601String();
    final filePath = '${tempDir.path}/Immich_log_$dateTime.csv';
    final logFile = await File(filePath).create();
    final io = logFile.openWrite();
    try {
      // Write header
      io.write("created_at,level,context,message,stacktrace\n");

      // Write messages
      for (final m in messages) {
        io.write(
          '${m.createdAt},${m.level},"${m.context1 ?? ""}","${m.message}","${m.context2 ?? ""}"\n',
        );
      }
    } finally {
      await io.flush();
      await io.close();
    }

    // Share file
    // ignore: deprecated_member_use
    await Share.shareFiles(
      [filePath],
      subject: "Immich logs $dateTime",
      sharePositionOrigin: Rect.zero,
    );

    // Clean up temp file
    await logFile.delete();
  }
}
