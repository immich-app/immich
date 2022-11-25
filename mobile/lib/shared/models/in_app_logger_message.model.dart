import 'package:hive/hive.dart';

part 'in_app_logger_message.model.g.dart';

@HiveType(typeId: 3)
class InAppLoggerMessage {
  @HiveField(0)
  String message;

  @HiveField(1, defaultValue: "info")
  String type;

  @HiveField(2)
  DateTime createdAt;

  @HiveField(3)
  String? context1;

  @HiveField(4)
  String? context2;

  InAppLoggerMessage({
    required this.message,
    required this.type,
    required this.createdAt,
    required this.context1,
    required this.context2,
  });

  @override
  String toString() {
    return 'InAppLoggerMessage(message: $message, type: $type, createdAt: $createdAt)';
  }
}
