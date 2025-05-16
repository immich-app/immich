import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:logging/logging.dart';

typedef AsyncFuture<T> = Future<AsyncValue<T>>;

mixin ErrorLoggerMixin {
  abstract final Logger logger;

  // ignore: unintended_html_in_doc_comment
  /// Returns an AsyncValue<T> if the future is successfully executed
  /// Else, logs the error to the overridden logger and returns an AsyncError<>
  AsyncFuture<T> guardError<T>(
    Future<T> Function() fn, {
    required String errorMessage,
    Level logLevel = Level.SEVERE,
  }) async {
    try {
      final result = await fn();
      return AsyncData(result);
    } catch (error, stackTrace) {
      logger.log(logLevel, errorMessage, error, stackTrace);
      return AsyncError(error, stackTrace);
    }
  }

  /// Returns the result of the future if success
  /// Else, logs the error and returns the default value
  Future<T> logError<T>(
    Future<T> Function() fn, {
    required T defaultValue,
    required String errorMessage,
    Level logLevel = Level.SEVERE,
  }) async {
    try {
      return await fn();
    } catch (error, stackTrace) {
      logger.log(logLevel, errorMessage, error, stackTrace);
    }
    return defaultValue;
  }
}
