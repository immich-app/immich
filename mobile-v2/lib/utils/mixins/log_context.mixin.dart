import 'package:flutter/foundation.dart';
import 'package:logging/logging.dart';

mixin LogContext {
  @protected
  @nonVirtual
  Logger get log => Logger(runtimeType.toString());
}
