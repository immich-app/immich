import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:logging/logging.dart';

Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  Logger.root.level = Level.OFF;
  EasyLocalization.logger.enableBuildModes = [];
  // ignore: banned-usage
  debugPrint = (String? message, {int? wrapWidth}) {};
  return testMain();
}
