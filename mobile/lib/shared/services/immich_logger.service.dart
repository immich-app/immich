import 'dart:io';

import 'package:flutter/widgets.dart';
import 'package:hive/hive.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/shared/models/in_app_logger_message.model.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

class ImmichLogger {
  final String logContext;
  final maxLogEntries = 200;

  final Box<InAppLoggerMessage> _box = Hive.box(inAppLoggerBox);

  List<InAppLoggerMessage> get messages =>
      _box.values.toList().reversed.toList();

  ImmichLogger(this.logContext) {
    if (_box.length > maxLogEntries) {
      var numberOfEntryToBeDeleted = _box.length - maxLogEntries;
      for (var i = 0; i < numberOfEntryToBeDeleted; i++) {
        _box.deleteAt(0);
      }
    }
  }

  void log(
    message, {
    ImmichLogLevel level = ImmichLogLevel.info,
    String? additionalContext,
  }) {
    var formattedMessage =
        "[$logContext] ${additionalContext != null ? '[$additionalContext]' : ""}: $message";
    debugPrint(formattedMessage);
    var log = InAppLoggerMessage(
      message: formattedMessage,
      level: level,
      createdAt: DateTime.now(),
      context1: logContext,
      context2: additionalContext ?? "",
    );

    _box.add(log);
  }

  void clearLogs() {
    _box.clear();
  }

  shareLogs() async {
    var tempDir = await getTemporaryDirectory();
    var filePath = '${tempDir.path}/${DateTime.now().toIso8601String()}.csv';
    var logFile = await File(filePath).create();
    // Write header
    logFile.writeAsStringSync("created_at,context_1,context_2,message,type\n");

    // Write messages
    for (var message in messages) {
      logFile.writeAsStringSync(
        "${message.createdAt},${message.context1 ?? ""},${message.context2 ?? ""},${message.message},${message.level.toString()}\n",
        mode: FileMode.append,
      );
    }

    // Share file
    Share.shareFiles(
      [filePath],
      subject: "Immich logs ${DateTime.now().toIso8601String()}",
      sharePositionOrigin: Rect.zero,
    );
  }
}
