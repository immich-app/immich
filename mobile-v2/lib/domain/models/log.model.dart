import 'package:logging/logging.dart';

/// Log levels according to dart logging [Level]
enum LogLevel {
  all,
  finest,
  finer,
  fine,
  config,
  info,
  warning,
  severe,
  shout,
  off,
}

extension LevelExtension on Level {
  LogLevel toLogLevel() =>
      LogLevel.values.elementAtOrNull(Level.LEVELS.indexOf(this)) ??
      LogLevel.info;
}

class LogMessage {
  final int id;
  final String content;
  final LogLevel level;
  final DateTime createdAt;
  final String? logger;
  final String? error;
  final String? stack;

  const LogMessage({
    required this.id,
    required this.content,
    required this.level,
    required this.createdAt,
    this.logger,
    this.error,
    this.stack,
  });

  @override
  bool operator ==(covariant LogMessage other) {
    if (identical(this, other)) return true;

    return other.hashCode == hashCode;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        content.hashCode ^
        level.hashCode ^
        createdAt.hashCode ^
        logger.hashCode ^
        error.hashCode ^
        stack.hashCode;
  }
}
