import 'package:hive/hive.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/shared/models/in_app_logger_message.model.dart';

class InAppLoggerService {
  String fileName = "";
  final Box<InAppLoggerMessage> _box = Hive.box(inAppLoggerBox);

  List<InAppLoggerMessage> get messages => _box.values.toList();

  // Keep the last 100 messages from box when initializing the constructor
  InAppLoggerService(this.fileName) {
    // Remove the first 50 messages if there are more than 100 messages
    if (_box.length > 100) {
      var indexesToBeDeleted = _box.length - 100;
      for (var i = 0; i < indexesToBeDeleted; i++) {
        _box.deleteAt(indexesToBeDeleted);
      }
    }
  }

  void addMessage(message, {String type = "info"}) {
    var formattedMessage = "[$fileName]: $message";
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
