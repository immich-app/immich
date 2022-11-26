import 'package:hive/hive.dart';

part 'in_app_logger_message.model.g.dart';

@HiveType(typeId: 3)
class InAppLoggerMessage {
  @HiveField(0)
  String message;

  @HiveField(1, defaultValue: ImmichLogLevel.info)
  ImmichLogLevel level;

  @HiveField(2)
  DateTime createdAt;

  @HiveField(3)
  String? context1;

  @HiveField(4)
  String? context2;

  InAppLoggerMessage({
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

@HiveType(typeId: 4)
enum ImmichLogLevel {
  @HiveField(0)
  info,

  @HiveField(1)
  warning,

  @HiveField(2)
  error,
}
