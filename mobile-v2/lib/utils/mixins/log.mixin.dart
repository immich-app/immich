import 'package:flutter/foundation.dart';
import 'package:immich_mobile/utils/log_manager.dart';

mixin LogMixin {
  @protected
  @nonVirtual
  Logger get log => LogManager.I.get(runtimeType.toString());
}
