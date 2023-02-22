import 'package:hive/hive.dart';

part 'immich_logger_message.model.g.dart';

@HiveType(typeId: 3)
class ImmichLoggerMessage {
  @HiveField(0)
  String message;

  @HiveField(1, defaultValue: "INFO")
  String level;

  @HiveField(2)
  DateTime createdAt;

  @HiveField(3)
  String? context1;

  @HiveField(4)
  String? context2;

  ImmichLoggerMessage({
    required this.message,
    required this.level,
    required this.createdAt,
    required this.context1,
    required this.context2,
  });

  @override
  String toString() {
    return 'InAppLoggerMessage(message: $message, level: $level, createdAt: $createdAt)';
  }
}
