import 'dart:async';
import 'dart:io';

import 'package:flutter/widgets.dart';
import 'package:immich_mobile/entities/logger_message.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
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
class ImmichLogger {
  static final ImmichLogger _instance = ImmichLogger._internal();
  final maxLogEntries = 500;
  final Isar _db = Isar.getInstance()!;
  List<LoggerMessage> _msgBuffer = [];
  Timer? _timer;

  factory ImmichLogger() => _instance;

  ImmichLogger._internal() {
    _removeOverflowMessages();
    final int levelId = Store.get(StoreKey.logLevel, 5); // 5 is INFO
    Logger.root.level = Level.LEVELS[levelId];
    Logger.root.onRecord.listen(_writeLogToDatabase);
  }

  set level(Level level) => Logger.root.level = level;

  List<LoggerMessage> get messages {
    final inDb =
        _db.loggerMessages.where(sort: Sort.desc).anyId().findAllSync();
    return _msgBuffer.isEmpty ? inDb : _msgBuffer.reversed.toList() + inDb;
  }

  void _removeOverflowMessages() {
    final msgCount = _db.loggerMessages.countSync();
    if (msgCount > maxLogEntries) {
      final numberOfEntryToBeDeleted = msgCount - maxLogEntries;
      _db.writeTxn(
        () => _db.loggerMessages
            .where()
            .limit(numberOfEntryToBeDeleted)
            .deleteAll(),
      );
    }
  }

  void _writeLogToDatabase(LogRecord record) {
    debugPrint('[${record.level.name}] [${record.time}] ${record.message}');
    final lm = LoggerMessage(
      message: record.message,
      details: record.error?.toString(),
      level: record.level.toLogLevel(),
      createdAt: record.time,
      context1: record.loggerName,
      context2: record.stackTrace?.toString(),
    );
    _msgBuffer.add(lm);

    // delayed batch writing to database: increases performance when logging
    // messages in quick succession and reduces NAND wear
    _timer ??= Timer(const Duration(seconds: 5), _flushBufferToDatabase);
  }

  void _flushBufferToDatabase() {
    _timer = null;
    final buffer = _msgBuffer;
    _msgBuffer = [];
    _db.writeTxn(() => _db.loggerMessages.putAll(buffer));
  }

  void clearLogs() {
    _timer?.cancel();
    _timer = null;
    _msgBuffer.clear();
    _db.writeTxn(() => _db.loggerMessages.clear());
  }

  Future<void> shareLogs() async {
    final tempDir = await getTemporaryDirectory();
    final dateTime = DateTime.now().toIso8601String();
    final filePath = '${tempDir.path}/Immich_log_$dateTime.log';
    final logFile = await File(filePath).create();
    final io = logFile.openWrite();
    try {
      // Write messages
      for (final m in messages) {
        final created = m.createdAt;
        final level = m.level.name.padRight(8);
        final logger = (m.context1 ?? "<UNKNOWN_LOGGER>").padRight(20);
        final message = m.message;
        final error = m.details != null ? " ${m.details} |" : "";
        final stack = m.context2 != null ? "\n${m.context2!}" : "";
        io.write('$created | $level | $logger | $message |$error$stack\n');
      }
    } finally {
      await io.flush();
      await io.close();
    }

    // Share file
    await Share.shareXFiles(
      [XFile(filePath)],
      subject: "Immich logs $dateTime",
      sharePositionOrigin: Rect.zero,
    ).then(
      (value) => logFile.delete(),
    );
  }

  /// Flush pending log messages to persistent storage
  void flush() {
    if (_timer != null) {
      _timer!.cancel();
      _db.writeTxnSync(() => _db.loggerMessages.putAllSync(_msgBuffer));
    }
  }
}
