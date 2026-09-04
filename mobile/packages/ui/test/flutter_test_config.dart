import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:snapshot_test/fonts.dart';

const _appFontDirectories = {
  'GoogleSans': '../../fonts/GoogleSans',
  'GoogleSansCode': '../../fonts/GoogleSansCode',
};

Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  TestWidgetsFlutterBinding.ensureInitialized();

  await loadTestFonts(familyDirectories: _appFontDirectories);

  return testMain();
}
