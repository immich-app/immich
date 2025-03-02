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

class LogMessage {
  final String message;
  final LogLevel level;
  final DateTime createdAt;
  final String? logger;
  final String? error;
  final String? stack;

  const LogMessage({
    required this.message,
    required this.level,
    required this.createdAt,
    this.logger,
    this.error,
    this.stack,
  });

  @override
  bool operator ==(covariant LogMessage other) {
    if (identical(this, other)) return true;

    return other.message == message &&
        other.level == level &&
        other.createdAt == createdAt &&
        other.logger == logger &&
        other.error == error &&
        other.stack == stack;
  }

  @override
  int get hashCode {
    return message.hashCode ^
        level.hashCode ^
        createdAt.hashCode ^
        logger.hashCode ^
        error.hashCode ^
        stack.hashCode;
  }

  @override
  String toString() {
    return '''LogMessage: {
message: $message,
level: $level,
createdAt: $createdAt,
logger: ${logger ?? '<NA>'},
error: ${error ?? '<NA>'},
stack: ${stack ?? '<NA>'},
}''';
  }
}
