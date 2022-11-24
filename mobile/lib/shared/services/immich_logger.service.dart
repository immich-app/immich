import 'package:flutter/foundation.dart';
import 'package:hive/hive.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/shared/models/in_app_logger_message.model.dart';

class ImmichLogger {
  String logContext = "";
  final Box<InAppLoggerMessage> _box = Hive.box(inAppLoggerBox);

  List<InAppLoggerMessage> get messages =>
      _box.values.toList().reversed.toList();

  ImmichLogger(this.logContext) {
    if (_box.length > 100) {
      var indexesToBeDeleted = _box.length - 100;
      for (var i = 0; i < indexesToBeDeleted; i++) {
        _box.deleteAt(indexesToBeDeleted);
      }
    }
  }

  void log(message, {String type = "info", String? additionalContext}) {
    var formattedMessage =
        "[$logContext] ${additionalContext != null ? '[$additionalContext]' : ""}: $message";
    debugPrint(formattedMessage);
    var log = InAppLoggerMessage(
      message: formattedMessage,
      type: type,
      createdAt: DateTime.now(),
    );

    _box.add(log);
  }

  void clearMessages() {
    _box.clear();
  }
}
