import 'package:flutter/foundation.dart';
import 'package:logging/logging.dart';

/// Log levels according to dart logging [Level]
enum LogLevel {
  // do not change this order!
  verbose,
  debug,
  info,
  warning,
  error,
  wtf,
}

extension LevelExtension on Level {
  LogLevel toLogLevel() => switch (this) {
        Level.FINEST => LogLevel.verbose,
        Level.FINE => LogLevel.debug,
        Level.INFO => LogLevel.info,
        Level.WARNING => LogLevel.warning,
        Level.SEVERE => LogLevel.error,
        Level.SHOUT => LogLevel.wtf,
        _ => LogLevel.info,
      };
}

@immutable
class LogMessage {
  final String content;
  final LogLevel level;
  final DateTime createdAt;
  final String? logger;
  final String? error;
  final String? stack;

  const LogMessage({
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
    return content.hashCode ^
        level.hashCode ^
        createdAt.hashCode ^
        logger.hashCode ^
        error.hashCode ^
        stack.hashCode;
  }
}
