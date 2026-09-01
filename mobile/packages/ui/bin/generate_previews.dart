// ignore_for_file: avoid_print

import 'dart:io';

final _preview = RegExp(r"@ImmichPreview\([^)]*name:\s*'([^']*)'[^)]*\)\s*Widget\s+(\w+)\(\)");

/// Generates the registry of every `@ImmichPreview` in `lib/src/previews/`
void main() {
  final files = Directory('lib/src/previews').listSync().whereType<File>().toList()
    ..sort((a, b) => a.path.compareTo(b.path));

  final imports = StringBuffer();
  final entries = StringBuffer();

  var foundCount = 0;
  var annotationCount = 0;

  for (final file in files) {
    final source = file.readAsStringSync();
    final component = file.uri.pathSegments.last.replaceAll('.dart', '');

    annotationCount += '@ImmichPreview'.allMatches(source).length;
    imports.writeln("import 'package:immich_ui/src/previews/$component.dart';");

    for (final match in _preview.allMatches(source)) {
      final state = match.group(1)!.toLowerCase().replaceAll(RegExp('[^a-z0-9]+'), '_');
      entries.writeln("  '$component.$state': ${match.group(2)},");

      foundCount++;
    }
  }

  if (foundCount != annotationCount) {
    throw StateError(
      'Parsed $foundCount of $annotationCount @ImmichPreview annotations. One does not match the expected '
      "`@ImmichPreview(..., name: '...') Widget name() => ...` shape.",
    );
  }

  File('test/snapshot/previews.g.dart').writeAsStringSync('''
// DO NOT EDIT. This is code generated via generate_previews.dart

import 'package:flutter/widgets.dart';
$imports
/// Every `@ImmichPreview` in the package, keyed by snapshot file name.
const previews = <String, Widget Function()>{
$entries};
''');
  print('Generated test/snapshot/previews.g.dart with $foundCount previews');
}
