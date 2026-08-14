import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

final immichLogoProvider = FutureProvider.autoDispose<Uint8List>((ref) async {
  final json = await rootBundle.loadString('assets/immich-logo.json');
  final j = jsonDecode(json);
  return base64Decode(j['content']);
});
