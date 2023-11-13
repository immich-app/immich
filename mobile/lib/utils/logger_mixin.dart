import 'package:logging/logging.dart';

mixin ErrorLoggerMixin {
  Logger get log;

  Future<T?> logOnError<T>(
    Future<T?> Function() future, {
    String? futureName,
    Level level = Level.SEVERE,
  }) async {
    return logOnErrorWithDefault(
      future,
      null,
      futureName: futureName,
      level: level,
    );
  }

  Future<T> logOnErrorWithDefault<T>(
    Future<T> Function() future,
    T defaultValue, {
    String? futureName,
    Level level = Level.SEVERE,
  }) async {
    try {
      return await future();
    } catch (err, stack) {
      log.log(
        level,
        "Error ${futureName != null ? '[$futureName] ' : ''}",
        err,
        stack,
      );
      return defaultValue;
    }
  }
}
