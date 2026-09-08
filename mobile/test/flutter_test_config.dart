import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:logging/logging.dart';
import 'package:snapshot_test/fonts.dart';

Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  Logger.root.level = Level.OFF;
  EasyLocalization.logger.enableBuildModes = [];
  // ignore: banned-usage
  debugPrint = (String? message, {int? wrapWidth}) {};

  TestWidgetsFlutterBinding.ensureInitialized();
  await loadTestFonts();

  return testMain();
}
