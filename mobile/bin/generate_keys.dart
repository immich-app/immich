import 'dart:convert';
import 'dart:io';

const _kReservedWords = ['continue'];

void main() async {
  final sourceFile = File('../i18n/en.json');
  if (!await sourceFile.exists()) {
    stderr.writeln('Source file does not exist');
    return;
  }

  final outputDir = Directory('lib/generated');
  await outputDir.create(recursive: true);

  final outputFile = File('lib/generated/intl_keys.g.dart');
  await _generate(sourceFile, outputFile);
  print('Generated ${outputFile.path}');
}

Future<void> _generate(File source, File output) async {
  final content = await source.readAsString();
  final translations = json.decode(content) as Map<String, dynamic>;

  final buffer = StringBuffer('''
// DO NOT EDIT. This is code generated via generate_keys.dart

abstract class IntlKeys {
''');

  _writeKeys(buffer, translations);
  buffer.writeln('}');

  await output.writeAsString(buffer.toString());
}

void _writeKeys(
  StringBuffer buffer,
  Map<String, dynamic> map, [
  String prefix = '',
]) {
  for (final entry in map.entries) {
    final key = entry.key;
    final value = entry.value;

    if (value is Map<String, dynamic>) {
      _writeKeys(buffer, value, prefix.isEmpty ? key : '${prefix}_$key');
    } else {
      final name = _cleanName(prefix.isEmpty ? key : '${prefix}_$key');
      final path = prefix.isEmpty ? key : '$prefix.$key'.replaceAll('_', '.');
      buffer.writeln('  static const $name = \'$path\';');
    }
  }
}

String _cleanName(String name) {
  name = name.replaceAll(RegExp(r'[^a-zA-Z0-9_]'), '_');
  if (RegExp(r'^[0-9]').hasMatch(name)) name = 'k_$name';
  if (_kReservedWords.contains(name)) name = '${name}_';
  return name;
}
