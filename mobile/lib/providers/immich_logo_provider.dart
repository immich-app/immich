import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'immich_logo_provider.g.dart';

@riverpod
Future<Uint8List> immichLogo(ImmichLogoRef ref) async {
  final json = await rootBundle.loadString('assets/immich-logo.json');
  final j = jsonDecode(json);
  return base64Decode(j['content']);
}
