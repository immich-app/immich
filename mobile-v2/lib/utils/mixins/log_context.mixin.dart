import 'package:flutter/foundation.dart';
import 'package:logging/logging.dart';

mixin LogContext {
  late final String ctx = logContext;

  /// Context name of the log message
  /// Override this to provide a custom name
  String get logContext => runtimeType.toString();

  @protected
  @nonVirtual
  Logger get log => Logger.detached(ctx);
}
