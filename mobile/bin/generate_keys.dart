// ignore_for_file: avoid_print

import 'dart:convert';
import 'dart:io';

const _kReservedWords = [
  'abstract',
  'as',
  'assert',
  'async',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'covariant',
  'default',
  'deferred',
  'do',
  'dynamic',
  'else',
  'enum',
  'export',
  'extends',
  'extension',
  'external',
  'factory',
  'false',
  'final',
  'finally',
  'for',
  'Function',
  'get',
  'hide',
  'if',
  'implements',
  'import',
  'in',
  'interface',
  'is',
  'late',
  'library',
  'mixin',
  'new',
  'null',
  'on',
  'operator',
  'part',
  'required',
  'rethrow',
  'return',
  'sealed',
  'set',
  'show',
  'static',
  'super',
  'switch',
  'sync',
  'this',
  'throw',
  'true',
  'try',
  'typedef',
  'var',
  'void',
  'when',
  'while',
  'with',
  'yield',
];

const _kIntParamNames = [
  'count',
  'number',
  'amount',
  'total',
  'index',
  'size',
  'length',
  'width',
  'height',
  'year',
  'month',
  'day',
  'hour',
  'minute',
  'second',
  'page',
  'limit',
  'offset',
  'max',
  'min',
  'id',
  'num',
  'quantity',
];

void main() async {
  final sourceFile = File('../i18n/en.json');
  if (!await sourceFile.exists()) {
    stderr.writeln('Source file does not exist');
    return;
  }

  final outputDir = Directory('lib/generated');
  await outputDir.create(recursive: true);

  final content = await sourceFile.readAsString();
  final translations = json.decode(content) as Map<String, dynamic>;

  final outputFile = File('lib/generated/translations.g.dart');
  await _generateTranslations(translations, outputFile);
  print('Generated ${outputFile.path}');
}

class TranslationNode {
  final String key;
  final String? value;
  final Map<String, TranslationNode> children;
  final List<TranslationParam> params;

  const TranslationNode({
    required this.key,
    this.value,
    Map<String, TranslationNode>? children,
    List<TranslationParam>? params,
  }) : children = children ?? const {},
       params = params ?? const [];

  bool get isLeaf => value != null;
  bool get hasParams => params.isNotEmpty;
}

class TranslationParam {
  final String name;
  final String type;

  const TranslationParam(this.name, this.type);
}

Future<void> _generateTranslations(Map<String, dynamic> translations, File output) async {
  final root = _buildTranslationTree('', translations);

  final buffer = StringBuffer('''
// DO NOT EDIT. This is code generated via generate_keys.dart

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/widgets.dart';
import 'package:intl/message_format.dart';

extension TranslationsExtension on BuildContext {
  Translations get t => Translations.of(this);
}

class StaticTranslations {
  StaticTranslations._();
  static final instance = Translations._(null);
}

abstract class _BaseTranslations {
  BuildContext? get _context;

  String _t(String key, [Map<String, Object>? args]) {
    if (key.isEmpty) return '';
    try {
      final translated = key.tr(context: _context);
      return args != null
          ? MessageFormat(translated, locale: Intl.defaultLocale ?? 'en').format(args)
          : translated;
    } catch (e) {
      return key;
    }
  }
}

class Translations extends _BaseTranslations {
  @override
  final BuildContext? _context;
  Translations._(this._context);

  static Translations of(BuildContext context) {
    context.locale;
    return Translations._(context);
  }

''');

  _generateClassMembers(buffer, root, '  ');
  buffer.writeln('}');
  _generateNestedClasses(buffer, root);

  await output.writeAsString(buffer.toString());
}

TranslationNode _buildTranslationTree(String key, dynamic value) {
  if (value is Map<String, dynamic>) {
    final children = <String, TranslationNode>{};
    for (final entry in value.entries) {
      children[entry.key] = _buildTranslationTree(entry.key, entry.value);
    }
    return TranslationNode(key: key, children: children);
  } else {
    final stringValue = value.toString();
    final params = _extractParams(stringValue);
    return TranslationNode(key: key, value: stringValue, params: params);
  }
}

List<TranslationParam> _extractParams(String value) {
  final params = <String, TranslationParam>{};

  final icuRegex = RegExp(r'\{(\w+),\s*(plural|select|number|date|time)([^}]*(?:\{[^}]*\}[^}]*)*)\}');
  for (final match in icuRegex.allMatches(value)) {
    final name = match.group(1)!;
    final icuType = match.group(2)!;
    final icuContent = match.group(3) ?? '';

    if (params.containsKey(name)) continue;

    String type;
    if (icuType == 'plural' || icuType == 'number') {
      type = 'int';
    } else if (icuType == 'select') {
      final hasTrueFalse = RegExp(r',\s*(true|false)\s*\{').hasMatch(icuContent);
      type = hasTrueFalse ? 'bool' : 'String';
    } else {
      type = 'String';
    }

    params[name] = TranslationParam(name, type);
  }

  var cleanedValue = value;
  var depth = 0;
  var icuStart = -1;

  for (var i = 0; i < value.length; i++) {
    if (value[i] == '{') {
      if (depth == 0) icuStart = i;
      depth++;
    } else if (value[i] == '}') {
      depth--;
      if (depth == 0 && icuStart >= 0) {
        final block = value.substring(icuStart, i + 1);
        if (RegExp(r'^\{\w+,').hasMatch(block)) {
          cleanedValue = cleanedValue.replaceFirst(block, '');
        }
        icuStart = -1;
      }
    }
  }

  final simpleRegex = RegExp(r'\{(\w+)\}');
  for (final match in simpleRegex.allMatches(cleanedValue)) {
    final name = match.group(1)!;

    if (params.containsKey(name)) continue;

    String type;
    if (_kIntParamNames.contains(name.toLowerCase())) {
      type = 'int';
    } else {
      type = 'Object';
    }

    params[name] = TranslationParam(name, type);
  }

  return params.values.toList();
}

void _generateClassMembers(StringBuffer buffer, TranslationNode node, String indent, [String keyPrefix = '']) {
  final sortedKeys = node.children.keys.toList()..sort();

  for (final childKey in sortedKeys) {
    final child = node.children[childKey]!;
    final dartName = _escapeName(childKey);
    final fullKey = keyPrefix.isEmpty ? childKey : '$keyPrefix.$childKey';

    if (child.isLeaf) {
      if (child.hasParams) {
        _generateMethod(buffer, dartName, fullKey, child.params, indent);
      } else {
        _generateGetter(buffer, dartName, fullKey, indent);
      }
    } else {
      final className = _toNestedClassName(keyPrefix, childKey);
      buffer.writeln('${indent}late final $dartName = $className._(_context);');
    }
  }
}

void _generateGetter(StringBuffer buffer, String dartName, String translationKey, String indent) {
  buffer.writeln('${indent}String get $dartName => _t(\'$translationKey\');');
}

void _generateMethod(
  StringBuffer buffer,
  String dartName,
  String translationKey,
  List<TranslationParam> params,
  String indent,
) {
  final paramList = params.map((p) => 'required ${p.type} ${_escapeName(p.name)}').join(', ');
  final argsMap = params.map((p) => '\'${p.name}\': ${_escapeName(p.name)}').join(', ');
  buffer.writeln('${indent}String $dartName({$paramList}) => _t(\'$translationKey\', {$argsMap});');
}

void _generateNestedClasses(StringBuffer buffer, TranslationNode node, [String keyPrefix = '']) {
  final sortedKeys = node.children.keys.toList()..sort();

  for (final childKey in sortedKeys) {
    final child = node.children[childKey]!;
    final fullKey = keyPrefix.isEmpty ? childKey : '$keyPrefix.$childKey';

    if (!child.isLeaf && child.children.isNotEmpty) {
      final className = _toNestedClassName(keyPrefix, childKey);
      buffer.writeln();
      buffer.writeln('class $className extends _BaseTranslations {');
      buffer.writeln('  @override');
      buffer.writeln('  final BuildContext? _context;');
      buffer.writeln('  $className._(this._context);');
      _generateClassMembers(buffer, child, '  ', fullKey);
      buffer.writeln('}');
      _generateNestedClasses(buffer, child, fullKey);
    }
  }
}

String _toNestedClassName(String prefix, String key) {
  final parts = <String>[];
  if (prefix.isNotEmpty) {
    parts.addAll(prefix.split('.'));
  }
  parts.add(key);

  final result = StringBuffer('_');
  for (final part in parts) {
    final words = part.split('_');
    for (final word in words) {
      if (word.isNotEmpty) {
        result.write(word[0].toUpperCase());
        if (word.length > 1) {
          result.write(word.substring(1).toLowerCase());
        }
      }
    }
  }
  result.write('Translations');

  return result.toString();
}

String _escapeName(String name) {
  if (_kReservedWords.contains(name)) {
    return '$name\$';
  }
  if (RegExp(r'^[0-9]').hasMatch(name)) {
    return 'k$name';
  }
  return name;
}
