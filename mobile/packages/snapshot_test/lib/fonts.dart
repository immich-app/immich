import 'dart:convert';
import 'dart:io';

import 'package:flutter/services.dart';

/// Loads provided fonts from disk and from the asset bundle
Future<void> loadTestFonts({
  Map<String, String> familyDirectories = const {},
}) async {
  final manifest = (jsonDecode(
    await rootBundle.loadString('FontManifest.json'),
  ) as List<dynamic>).cast<Map<String, dynamic>>();

  for (final family in manifest) {
    final loader = FontLoader(family['family'] as String);

    for (final font
        in (family['fonts'] as List<dynamic>).cast<Map<String, dynamic>>()) {
      loader.addFont(rootBundle.load(font['asset'] as String));
    }

    await loader.load();
  }

  for (final MapEntry(key: family, value: directory)
      in familyDirectories.entries) {
    final loader = FontLoader(family);

    for (final file in Directory(directory).listSync().whereType<File>()) {
      if (file.path.endsWith('.ttf')) {
        loader.addFont(file.readAsBytes().then(ByteData.sublistView));
      }
    }

    await loader.load();
  }
}
